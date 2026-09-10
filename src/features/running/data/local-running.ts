import "server-only";

import { and, desc, eq } from "drizzle-orm";

import * as domain from "@/features/running/domain";

import { db } from "@/db/client";
import { runningSessions } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

export class LocalRunning
  implements domain.CreateRunningSession, domain.DeleteRunningSession, domain.LoadAllRunningSessions
{
  async create(params: domain.CreateRunningSession.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(runningSessions).values({
      id,
      userId,
      durationSeconds: params.durationSeconds,
      distanceMeters: params.distanceMeters,
      source: params.source,
    });

    return { id };
  }

  async delete(params: domain.DeleteRunningSession.Params) {
    const userId = await requireUserId();

    await db
      .delete(runningSessions)
      .where(and(eq(runningSessions.id, params.id), eq(runningSessions.userId, userId)));
  }

  async loadAll(): Promise<domain.LoadAllRunningSessions.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(runningSessions)
      .where(eq(runningSessions.userId, userId))
      .orderBy(desc(runningSessions.startedAt))
      .limit(30);

    const sessions = rows.map(mapRowToSession);

    const totals: domain.IRunningTotals = sessions.reduce(
      (acc, session) => ({
        totalDistanceMeters: acc.totalDistanceMeters + session.distanceMeters,
        totalDurationSeconds: acc.totalDurationSeconds + session.durationSeconds,
        sessionCount: acc.sessionCount + 1,
      }),
      { totalDistanceMeters: 0, totalDurationSeconds: 0, sessionCount: 0 }
    );

    return { sessions, totals };
  }
}

function mapRowToSession(row: typeof runningSessions.$inferSelect): domain.IRunningSession {
  const distanceKm = row.distanceMeters / 1000;
  const durationMinutes = row.durationSeconds / 60;

  return {
    id: row.id,
    userId: row.userId,
    startedAt: row.startedAt,
    durationSeconds: row.durationSeconds,
    distanceMeters: row.distanceMeters,
    source: row.source,
    paceMinPerKm: distanceKm > 0 ? durationMinutes / distanceKm : null,
    speedKmh: row.durationSeconds > 0 ? distanceKm / (row.durationSeconds / 3600) : 0,
  };
}
