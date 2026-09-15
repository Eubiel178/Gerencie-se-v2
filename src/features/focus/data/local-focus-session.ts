import "server-only";

import { and, desc, eq, gte, ne, sql } from "drizzle-orm";

import * as domain from "@/features/focus/domain";

import { db } from "@/db/client";
import { focusSessions } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

// 1 XP por minuto focado, arredondado pra baixo — sessões com menos de um
// minuto não rendem XP (evita ganhar recompensa por iniciar e cancelar na
// hora).
function calculateXp(actualDurationSeconds: number): number {
  return Math.floor(actualDurationSeconds / 60);
}

export class LocalFocusSession
  implements
    domain.StartFocusSession,
    domain.CompleteFocusSession,
    domain.CancelFocusSession,
    domain.ExtendFocusSession,
    domain.GetActiveFocusSession,
    domain.LoadFocusHistory,
    domain.LoadFocusHistoryInRange
{
  async start(params: domain.StartFocusSession.Params): Promise<domain.StartFocusSession.Result> {
    const userId = await requireUserId();

    const existing = await this.getActive();
    // Preenchido só se `start` precisar finalizar sozinho uma sessão órfã
    // vencida abaixo - quem chama (`startFocusSessionAction`) usa isso pra
    // creditar o XP dela no mascote, já que essa conclusão nunca passa por
    // `CompleteFocusSession` (o caminho normal que credita XP).
    let finalizedExpiredSessionXp: number | undefined;

    if (existing) {
      if (!domain.isFocusSessionExpired(existing)) {
        return {
          id: existing.id,
          startedAt: existing.startedAt,
          plannedDurationSeconds: existing.plannedDurationSeconds,
          taskId: existing.taskId,
        };
      }

      // Sessão órfã (aba fechada, hot-reload em dev, queda do app) cujo prazo
      // já passou: finaliza como concluída antes de abrir uma sessão nova.
      // Sem isso, a 1ª tentativa de iniciar o foco reaproveitava essa sessão
      // vencida e o relógio do cliente zerava quase na hora, mostrando "Foco
      // concluído!" prematuramente — a 2ª tentativa "funcionava" só porque a
      // sessão órfã já tinha sido concluída por essa mesma reação.
      finalizedExpiredSessionXp = await this.finalizeExpiredSession(existing);
    }

    const id = crypto.randomUUID();
    const startedAt = new Date();
    const taskId = params.taskId ?? null;

    // `onConflictDoNothing` mira o índice único parcial de schema.ts (no
    // máximo 1 sessão "running" por usuário) - cobre a janela entre o
    // `getActive()` no topo desta função e este INSERT, onde uma segunda
    // chamada concorrente (duplo-clique, duas abas) podia ler a mesma
    // ausência de sessão ativa e inserir a sua própria também (achado numa
    // revisão de código). Em vez de estourar o erro de constraint pro
    // usuário, trata como "perdeu a corrida" e devolve quem ganhou.
    const [inserted] = await db
      .insert(focusSessions)
      .values({
        id,
        userId,
        startedAt,
        plannedDurationSeconds: params.plannedDurationSeconds,
        status: "running",
        taskId,
      })
      .onConflictDoNothing({ target: focusSessions.userId, where: sql`${focusSessions.status} = 'running'` })
      .returning();

    if (!inserted) {
      const winner = await this.getActive();

      if (winner) {
        return {
          id: winner.id,
          startedAt: winner.startedAt,
          plannedDurationSeconds: winner.plannedDurationSeconds,
          taskId: winner.taskId,
        };
      }

      // Não deveria ser alcançável (o conflito só dispara se já existe uma
      // sessão "running" pro usuário) - mas não deixa a função retornar
      // silenciosamente undefined se algo mudar aqui no futuro.
      throw new Error("Conflito ao iniciar sessão de foco, mas nenhuma sessão ativa foi encontrada.");
    }

    return {
      id: inserted.id,
      startedAt: inserted.startedAt,
      plannedDurationSeconds: inserted.plannedDurationSeconds,
      taskId: inserted.taskId,
      finalizedExpiredSessionXp,
    };
  }

  async complete(params: domain.CompleteFocusSession.Params): Promise<domain.CompleteFocusSession.Result> {
    const userId = await requireUserId();

    const [session] = await db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.id, params.id), eq(focusSessions.userId, userId)))
      .limit(1);

    if (!session || session.status !== "running") {
      return { xpEarned: 0, actualDurationSeconds: 0 };
    }

    const endedAt = new Date();
    const actualDurationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
    );
    const xpEarned = calculateXp(actualDurationSeconds);

    await db
      .update(focusSessions)
      .set({ status: "completed", endedAt, actualDurationSeconds, xpEarned })
      .where(eq(focusSessions.id, params.id));

    return { xpEarned, actualDurationSeconds };
  }

  async extend(params: domain.ExtendFocusSession.Params): Promise<domain.ExtendFocusSession.Result> {
    const userId = await requireUserId();

    const [session] = await db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.id, params.id), eq(focusSessions.userId, userId)))
      .limit(1);

    if (!session || session.status !== "running") {
      return { plannedDurationSeconds: session?.plannedDurationSeconds ?? 0 };
    }

    const plannedDurationSeconds = session.plannedDurationSeconds + params.additionalSeconds;

    await db
      .update(focusSessions)
      .set({ plannedDurationSeconds })
      .where(eq(focusSessions.id, params.id));

    return { plannedDurationSeconds };
  }

  async cancel(params: domain.CancelFocusSession.Params): Promise<void> {
    const userId = await requireUserId();

    const [session] = await db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.id, params.id), eq(focusSessions.userId, userId)))
      .limit(1);

    if (!session || session.status !== "running") return;

    const endedAt = new Date();
    const actualDurationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
    );

    await db
      .update(focusSessions)
      .set({ status: "cancelled", endedAt, actualDurationSeconds })
      .where(eq(focusSessions.id, params.id));
  }

  // Credita o tempo planejado (não o tempo real decorrido) — o usuário
  // completou o que se propôs a fazer, só não voltou a tempo de ver o
  // relógio zerar. Não usa `Date.now()` como fim para não inflar XP de uma
  // sessão esquecida por horas ou dias. Devolve o XP calculado (em vez de
  // creditar direto no mascote aqui) porque esse repositório só é dono da
  // sessão de foco — creditar o mascote é orquestração de quem chama `start`
  // (mesmo raciocínio de `completeFocusSessionAction`, ver `actions.ts`).
  private async finalizeExpiredSession(session: domain.IFocusSession): Promise<number> {
    const actualDurationSeconds = session.plannedDurationSeconds;
    const endedAt = new Date(session.startedAt.getTime() + actualDurationSeconds * 1000);
    const xpEarned = calculateXp(actualDurationSeconds);

    // `AND status = 'running'` + `.returning()` torna isto uma atualização
    // condicional: se uma chamada concorrente já finalizou esta MESMA
    // sessão órfã primeiro, o status já não é mais "running" quando esta
    // instrução roda, então 0 linhas são afetadas aqui. Sem essa checagem,
    // duas chamadas de `start()` quase simultâneas podiam finalizar a
    // mesma sessão órfã cada uma na sua vez e as duas creditarem XP no
    // mascote pra um único período de foco (achado numa revisão de
    // código) - só quem realmente ganhou a corrida devolve um XP > 0 aqui.
    const [updated] = await db
      .update(focusSessions)
      .set({ status: "completed", endedAt, actualDurationSeconds, xpEarned })
      .where(and(eq(focusSessions.id, session.id), eq(focusSessions.status, "running")))
      .returning();

    return updated ? xpEarned : 0;
  }

  async getActive(): Promise<domain.IFocusSession | null> {
    const userId = await requireUserId();

    const [row] = await db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), eq(focusSessions.status, "running")))
      .limit(1);

    return row ? mapRowToFocusSession(row) : null;
  }

  async loadHistory(): Promise<domain.LoadFocusHistory.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), ne(focusSessions.status, "running")))
      .orderBy(desc(focusSessions.startedAt))
      .limit(10);

    return rows.map(mapRowToFocusSession);
  }

  async loadHistoryInRange(since: Date): Promise<domain.IFocusSession[]> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          ne(focusSessions.status, "running"),
          gte(focusSessions.startedAt, since)
        )
      )
      .orderBy(desc(focusSessions.startedAt));

    return rows.map(mapRowToFocusSession);
  }
}

function mapRowToFocusSession(row: typeof focusSessions.$inferSelect): domain.IFocusSession {
  return {
    id: row.id,
    userId: row.userId,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    plannedDurationSeconds: row.plannedDurationSeconds,
    actualDurationSeconds: row.actualDurationSeconds,
    status: row.status,
    xpEarned: row.xpEarned,
    taskId: row.taskId,
  };
}
