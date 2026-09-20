import "server-only";

import { eq, sql } from "drizzle-orm";

import * as domain from "@/features/focus/domain";

import { db } from "@/db/client";
import { mascotStates } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export class LocalMascot implements domain.GetMascotState, domain.AddMascotXp, domain.UpdateMascot {
  async getMascot(): Promise<domain.IMascotState> {
    const userId = await requireUserId();

    const [row] = await db
      .select()
      .from(mascotStates)
      .where(eq(mascotStates.userId, userId))
      .limit(1);

    if (row) return mapRowToMascot(row);

    // "Buscar, se não achar inserir" tem uma corrida real: `HomeLayout` e
    // a página (`Dashboard`) chamam `getMascot()` em paralelo na mesma
    // requisição - pra uma conta zerada, as duas passam pelo SELECT
    // achando nada antes de qualquer INSERT terminar, e a segunda esbarra
    // na chave primária da primeira (erro real de produção: "duplicate
    // key value violates unique constraint mascot_state_pkey", só na
    // PRIMEIRA visita de uma conta nova - um reload já encontra a linha
    // criada pela primeira tentativa). `onConflictDoNothing` faz a
    // segunda tentativa silenciosamente não fazer nada em vez de
    // estourar erro; sem `created` (RETURNING vazio quando o conflito é
    // ignorado), busca de novo pra pegar a linha que a OUTRA chamada
    // concorrente já criou.
    const [created] = await db
      .insert(mascotStates)
      .values({ userId })
      .onConflictDoNothing()
      .returning();

    if (created) return mapRowToMascot(created);

    const [existing] = await db
      .select()
      .from(mascotStates)
      .where(eq(mascotStates.userId, userId))
      .limit(1);

    return mapRowToMascot(existing);
  }

  async addXp(amount: number): Promise<domain.IMascotState> {
    const userId = await requireUserId();

    // Garante que a linha existe antes de somar (usuário pode nunca ter
    // acessado a página de foco antes de completar a primeira sessão).
    await this.getMascot();

    const [updated] = await db
      .update(mascotStates)
      .set({ totalXp: sql`${mascotStates.totalXp} + ${amount}`, updatedAt: new Date() })
      .where(eq(mascotStates.userId, userId))
      .returning();

    return mapRowToMascot(updated);
  }

  async updateMascot(patch: domain.IMascotPatch): Promise<void> {
    const userId = await requireUserId();

    await db
      .insert(mascotStates)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: mascotStates.userId,
        set: patch,
      });
  }
}

function mapRowToMascot(row: typeof mascotStates.$inferSelect): domain.IMascotState {
  const { level, xpIntoCurrentLevel, xpForNextLevel } = domain.calculateMascotLevel(row.totalXp);

  return {
    userId: row.userId,
    name: row.name,
    personality: row.personality,
    species: row.species,
    totalXp: row.totalXp,
    level,
    xpIntoCurrentLevel,
    xpForNextLevel,
  };
}
