import "server-only";

import dayjs from "dayjs";
import { and, eq, gte, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  focusSessions,
  goals,
  habitLogs,
  habits,
  mascotStates,
  runningSessions,
  tasks,
  users,
} from "@/db/schema";
import { calculateMascotLevel } from "@/features/focus/domain";
import { calculateGoalProgress } from "@/features/goals/domain";
import { calculateHabitStats } from "@/features/habits/domain";
import {
  calculateAverageGoalProgress,
  calculateBestHabitStreak,
  calculateTaskStats,
  calculateWeeklyFocusHours,
  calculateWeeklyRunningStats,
} from "@/features/stats/calculations";

import { WeeklySummary } from "./types";

const STREAK_WINDOW_DAYS = 60;

/**
 * Mesmo cálculo de `getWeeklySummaryForCurrentUser`, mas com `userId`
 * explícito em vez de vir da sessão HTTP — usado pelo envio automático
 * (rota de cron, sem cookie de sessão nenhum, um usuário de cada vez). As
 * mesmas funções puras de `stats/calculations.ts` são reaproveitadas; só a
 * forma de buscar o dado muda (consulta direta em vez dos fetchers presos
 * à sessão atual).
 */
export async function getWeeklySummaryForUser(userId: string): Promise<WeeklySummary | null> {
  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) return null;

  const now = dayjs();
  const weekStart = now.subtract(7, "day").toDate();
  const streakWindowStart = now.subtract(STREAK_WINDOW_DAYS, "day").format("YYYY-MM-DD");

  const [taskRows, focusRows, habitRows, goalRows, runningRows, mascotRows] = await Promise.all([
    db
      .select({
        completed: tasks.completed,
        completedAt: tasks.completedAt,
        scheduledAt: tasks.scheduledAt,
        startedAt: tasks.startedAt,
      })
      .from(tasks)
      .where(eq(tasks.userId, userId)),
    db
      .select({
        status: focusSessions.status,
        startedAt: focusSessions.startedAt,
        actualDurationSeconds: focusSessions.actualDurationSeconds,
      })
      .from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), gte(focusSessions.startedAt, weekStart))),
    db.select({ id: habits.id }).from(habits).where(and(eq(habits.userId, userId), eq(habits.archived, false))),
    db.query.goals.findMany({
      where: and(eq(goals.userId, userId), eq(goals.archived, false)),
      with: { steps: true },
    }),
    db
      .select({ distanceMeters: runningSessions.distanceMeters, startedAt: runningSessions.startedAt })
      .from(runningSessions)
      .where(and(eq(runningSessions.userId, userId), gte(runningSessions.startedAt, weekStart))),
    db.select().from(mascotStates).where(eq(mascotStates.userId, userId)).limit(1),
  ]);

  const habitIds = habitRows.map((row) => row.id);
  const logRows =
    habitIds.length === 0
      ? []
      : await db
          .select({ habitId: habitLogs.habitId, date: habitLogs.date })
          .from(habitLogs)
          .where(and(inArray(habitLogs.habitId, habitIds), gte(habitLogs.date, streakWindowStart)));

  const datesByHabit = new Map<string, Set<string>>();
  for (const log of logRows) {
    const dates = datesByHabit.get(log.habitId) ?? new Set<string>();
    dates.add(log.date);
    datesByHabit.set(log.habitId, dates);
  }

  const habitStreaks = habitIds.map((id) => calculateHabitStats(datesByHabit.get(id) ?? new Set()).currentStreak);
  const habitCompletionsThisWeek = habitIds.reduce(
    (total, id) => total + calculateHabitStats(datesByHabit.get(id) ?? new Set()).completionsThisWeek,
    0
  );

  const taskStats = calculateTaskStats(
    taskRows.map((task) => ({ ...task, scheduledAt: task.scheduledAt ?? undefined })),
    now
  );
  const weeklyRunning = calculateWeeklyRunningStats(runningRows, now);
  const goalsWithProgress = goalRows.map((goal) => ({
    progressPercent: calculateGoalProgress(goal.steps),
    archived: goal.archived,
  }));

  const mascotRow = mascotRows[0];
  const mascotLevelInfo = calculateMascotLevel(mascotRow?.totalXp ?? 0);

  return {
    name: user.name,
    email: user.email,
    tasksCompleted: taskStats.completedThisWeek,
    tasksPending: taskRows.filter((task) => !task.completed).length,
    tasksOverdue: taskStats.overdueCount,
    focusHours: calculateWeeklyFocusHours(focusRows, now),
    bestHabitStreak: calculateBestHabitStreak(habitStreaks.map((streak) => ({ currentStreak: streak }))),
    habitCompletionsThisWeek,
    activeHabits: habitIds.length,
    avgGoalProgress: calculateAverageGoalProgress(goalsWithProgress),
    activeGoals: goalRows.length,
    runningKm: weeklyRunning.distanceKm,
    mascotName: mascotRow?.name ?? "Chunchumaru",
    mascotLevel: mascotLevelInfo.level,
    mascotXpIntoLevel: mascotLevelInfo.xpIntoCurrentLevel,
    mascotXpForNextLevel: mascotLevelInfo.xpForNextLevel,
  };
}
