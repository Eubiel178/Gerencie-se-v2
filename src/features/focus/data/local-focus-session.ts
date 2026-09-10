import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";

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
    domain.GetActiveFocusSession,
    domain.LoadFocusHistory
{
  async start(params: domain.StartFocusSession.Params): Promise<domain.StartFocusSession.Result> {
    const userId = await requireUserId();

    const existing = await this.getActive();
    if (existing) {
      return {
        id: existing.id,
        startedAt: existing.startedAt,
        plannedDurationSeconds: existing.plannedDurationSeconds,
      };
    }

    const id = crypto.randomUUID();
    const startedAt = new Date();

    await db.insert(focusSessions).values({
      id,
      userId,
      startedAt,
      plannedDurationSeconds: params.plannedDurationSeconds,
      status: "running",
    });

    return { id, startedAt, plannedDurationSeconds: params.plannedDurationSeconds };
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
  };
}
