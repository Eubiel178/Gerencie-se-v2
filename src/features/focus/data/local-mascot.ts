import "server-only";

import { eq, sql } from "drizzle-orm";

import * as domain from "@/features/focus/domain";

import { db } from "@/db/client";
import { mascotStates } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

export class LocalMascot implements domain.GetMascotState, domain.AddMascotXp {
  async getMascot(): Promise<domain.IMascotState> {
    const userId = await requireUserId();

    const [row] = await db
      .select()
      .from(mascotStates)
      .where(eq(mascotStates.userId, userId))
      .limit(1);

    if (row) return mapRowToMascot(row);

    const [created] = await db
      .insert(mascotStates)
      .values({ userId })
      .returning();

    return mapRowToMascot(created);
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
}

function mapRowToMascot(row: typeof mascotStates.$inferSelect): domain.IMascotState {
  const { level, xpIntoCurrentLevel, xpForNextLevel } = domain.calculateMascotLevel(row.totalXp);

  return {
    userId: row.userId,
    name: row.name,
    totalXp: row.totalXp,
    level,
    xpIntoCurrentLevel,
    xpForNextLevel,
  };
}
