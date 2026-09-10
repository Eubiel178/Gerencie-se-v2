import "server-only";

import dayjs from "dayjs";
import { and, eq, gte } from "drizzle-orm";

import * as domain from "@/features/habits/domain";

import { db } from "@/db/client";
import { habitLogs, habits } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

const STREAK_WINDOW_DAYS = 60;

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de Habit.
 *
 * Segue o mesmo padrão de `LocalTask`/`LocalRoutineItem`. `loadAll()`
 * calcula sequência/porcentagem de conclusão a partir de `habit_log` a
 * cada chamada — nunca lê um valor pré-calculado, exatamente como o
 * comentário do schema pede.
 */
export class LocalHabit
  implements
    domain.CreateHabit,
    domain.LoadAllHabits,
    domain.UpdateHabit,
    domain.DeleteHabit,
    domain.ToggleHabitLog
{
  async create(params: domain.CreateHabit.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(habits).values({
      id,
      userId,
      title: params.title,
      frequency: params.frequency,
      targetPerWeek: params.targetPerWeek ?? null,
      goalId: params.goalId ?? null,
    });

    return { id };
  }

  async loadAll(): Promise<domain.LoadAllHabits.Model> {
    const userId = await requireUserId();

    const habitRows = await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.archived, false)));

    const windowStart = dayjs()
      .subtract(STREAK_WINDOW_DAYS, "day")
      .format("YYYY-MM-DD");

    const logRows = await db
      .select({ habitId: habitLogs.habitId, date: habitLogs.date })
      .from(habitLogs)
      .where(and(eq(habitLogs.userId, userId), gte(habitLogs.date, windowStart)));

    const datesByHabit = new Map<string, Set<string>>();

    for (const log of logRows) {
      const dates = datesByHabit.get(log.habitId) ?? new Set<string>();
      dates.add(log.date);
      datesByHabit.set(log.habitId, dates);
    }

    return habitRows.map((row) =>
      mapRowToHabit(row, datesByHabit.get(row.id) ?? new Set<string>())
    );
  }

  async update(params: domain.UpdateHabit.Params) {
    const userId = await requireUserId();

    await db
      .update(habits)
      .set({
        title: params.title,
        frequency: params.frequency,
        targetPerWeek: params.targetPerWeek ?? null,
        goalId: params.goalId ?? null,
      })
      .where(and(eq(habits.id, params.id), eq(habits.userId, userId)));
  }

  async delete(params: domain.DeleteHabit.Params) {
    const userId = await requireUserId();

    await db
      .delete(habits)
      .where(and(eq(habits.id, params.id), eq(habits.userId, userId)));
  }

  async toggleLog(params: domain.ToggleHabitLog.Params): Promise<domain.ToggleHabitLog.Result> {
    const userId = await requireUserId();

    const [existing] = await db
      .select({ id: habitLogs.id })
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, params.habitId),
          eq(habitLogs.userId, userId),
          eq(habitLogs.date, params.date)
        )
      )
      .limit(1);

    if (existing) {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
      return { completed: false };
    }

    try {
      await db.insert(habitLogs).values({
        id: crypto.randomUUID(),
        habitId: params.habitId,
        userId,
        date: params.date,
      });

      return { completed: true };
    } catch (error) {
      // Corrida rara (dois cliques quase simultâneos): outra requisição já
      // inseriu o mesmo (habitId, date) entre o SELECT acima e este INSERT
      // — a chave primária composta rejeita a duplicata. O hábito já está
      // marcado (foi a outra requisição que marcou primeiro), então
      // tratamos como sucesso em vez de propagar um erro confuso.
      const isUniqueViolation =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505";

      if (isUniqueViolation) {
        return { completed: true };
      }

      throw error;
    }
  }
}

function mapRowToHabit(
  row: typeof habits.$inferSelect,
  completedDates: Set<string>
): domain.IHabit {
  const today = dayjs();
  const todayKey = today.format("YYYY-MM-DD");

  const completedToday = completedDates.has(todayKey);

  // Sequência "perdoa" o dia atual ainda não marcado (o dia não acabou) —
  // só quebra a sequência se ONTEM também estiver faltando.
  let cursor = completedToday ? today : today.subtract(1, "day");
  let currentStreak = 0;

  while (completedDates.has(cursor.format("YYYY-MM-DD"))) {
    currentStreak += 1;
    cursor = cursor.subtract(1, "day");
  }

  let completionsThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    if (completedDates.has(today.subtract(i, "day").format("YYYY-MM-DD"))) {
      completionsThisWeek += 1;
    }
  }

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    frequency: row.frequency,
    targetPerWeek: row.targetPerWeek,
    goalId: row.goalId,
    archived: row.archived,
    createdAt: row.createdAt,
    completedToday,
    currentStreak,
    completionsThisWeek,
  };
}
