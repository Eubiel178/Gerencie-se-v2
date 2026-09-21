import "server-only";

import dayjs from "dayjs";
import { and, eq, gte } from "drizzle-orm";


import { db } from "@/db/client";
import { hydrationLogs, userPreferences } from "@/db/schema";
import * as domain from "@/features/hydration/domain";
import { requireUserId } from "@/lib/auth";
import { getOrCreateUserPreferencesRow } from "@/lib/shared/get-or-create-user-preferences";

const HISTORY_WINDOW_DAYS = 7;

export class LocalHydration
  implements
    domain.LogWater,
    domain.DeleteHydrationLog,
    domain.GetTodayHydration,
    domain.LoadWeekHydration,
    domain.LoadHydrationRange,
    domain.UpdateHydrationGoal
{
  async logWater(params: domain.LogWater.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(hydrationLogs).values({
      id,
      userId,
      date: dayjs().format("YYYY-MM-DD"),
      amountMl: params.amountMl,
    });

    return { id };
  }

  async deleteLog(params: domain.DeleteHydrationLog.Params) {
    const userId = await requireUserId();

    await db
      .delete(hydrationLogs)
      .where(and(eq(hydrationLogs.id, params.id), eq(hydrationLogs.userId, userId)));
  }

  async getToday(): Promise<domain.IHydrationSummary> {
    const userId = await requireUserId();
    const today = dayjs().format("YYYY-MM-DD");

    const [logs, goalMl] = await Promise.all([
      db
        .select()
        .from(hydrationLogs)
        .where(and(eq(hydrationLogs.userId, userId), eq(hydrationLogs.date, today))),
      this.getGoal(userId),
    ]);

    const mappedLogs = logs.map(mapRowToLog);

    return {
      date: today,
      totalMl: mappedLogs.reduce((sum, log) => sum + log.amountMl, 0),
      goalMl,
      logs: mappedLogs,
    };
  }

  async loadWeek(): Promise<domain.IHydrationDay[]> {
    return this.loadRange(HISTORY_WINDOW_DAYS);
  }

  /** Generalização de `loadWeek` pra qualquer janela de dias — usada pela
   * navegação por semanas anteriores em Estatísticas (`days` pode passar
   * de várias semanas). */
  async loadRange(days: number): Promise<domain.IHydrationDay[]> {
    const userId = await requireUserId();
    const windowStart = dayjs()
      .subtract(days - 1, "day")
      .format("YYYY-MM-DD");

    const rows = await db
      .select()
      .from(hydrationLogs)
      .where(and(eq(hydrationLogs.userId, userId), gte(hydrationLogs.date, windowStart)));

    const totalsByDate = new Map<string, number>();
    for (const row of rows) {
      totalsByDate.set(row.date, (totalsByDate.get(row.date) ?? 0) + row.amountMl);
    }

    const result: domain.IHydrationDay[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      result.push({ date, totalMl: totalsByDate.get(date) ?? 0 });
    }

    return result;
  }

  async updateGoal(dailyGoalMl: number) {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, hydrationDailyGoalMl: dailyGoalMl })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { hydrationDailyGoalMl: dailyGoalMl },
      });
  }

  private async getGoal(userId: string): Promise<number> {
    const row = await getOrCreateUserPreferencesRow(userId);
    return row.hydrationDailyGoalMl;
  }
}

function mapRowToLog(row: typeof hydrationLogs.$inferSelect): domain.IHydrationLog {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    amountMl: row.amountMl,
    loggedAt: row.loggedAt,
  };
}
