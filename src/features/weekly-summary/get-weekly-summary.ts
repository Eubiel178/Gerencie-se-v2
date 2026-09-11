import "server-only";

import { auth } from "@/lib/auth";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";

import {
  calculateAverageGoalProgress,
  calculateBestHabitStreak,
  calculateTaskStats,
  calculateWeeklyFocusHours,
  calculateWeeklyRunningStats,
} from "@/features/stats/calculations";

import { WeeklySummary } from "./types";

/** Versão vinculada à sessão atual — usada pelo botão "Enviar um teste
 * agora" em Configurações (sempre pro próprio e-mail de quem está
 * logado). Reaproveita os mesmos fetchers e cálculos de Estatísticas, só
 * reempacotados num resumo. Para o envio semanal de verdade (todos os
 * usuários, sem sessão HTTP nenhuma), ver `get-weekly-summary-for-user.ts`.
 */
export async function getWeeklySummaryForCurrentUser(): Promise<WeeklySummary | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const [tasks, focusHistory, habits, goals, running, mascot] = await Promise.all([
    getTaskFetcher().loadAll(),
    getFocusFetcher().loadHistory(),
    getHabitFetcher().loadAll(),
    getGoalFetcher().loadAll(),
    getRunningFetcher().loadAll(),
    getMascotFetcher().getMascot(),
  ]);

  const taskStats = calculateTaskStats(tasks);
  const weeklyRunning = calculateWeeklyRunningStats(running.sessions);

  return {
    name: session.user.name ?? null,
    email: session.user.email,
    tasksCompleted: taskStats.completedThisWeek,
    tasksPending: tasks.filter((task) => !task.completed).length,
    tasksOverdue: taskStats.overdueCount,
    focusHours: calculateWeeklyFocusHours(focusHistory),
    bestHabitStreak: calculateBestHabitStreak(habits),
    avgGoalProgress: calculateAverageGoalProgress(goals),
    runningKm: weeklyRunning.distanceKm,
    mascotName: mascot.name,
    mascotLevel: mascot.level,
    mascotXpIntoLevel: mascot.xpIntoCurrentLevel,
    mascotXpForNextLevel: mascot.xpForNextLevel,
  };
}
