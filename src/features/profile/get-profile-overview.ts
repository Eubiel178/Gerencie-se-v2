import "server-only";

import dayjs from "dayjs";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getFocusFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";

import {
  calculateBestHabitStreak,
  calculateTaskStats,
  calculateWeeklyFocusHours,
} from "@/features/stats/calculations";

export interface ProfileOverview {
  tasksCompletedThisWeek: number;
  completionRate: number;
  focusHours: number;
  bestHabitStreak: number;
}

/** Resumo curto pra bolinha de perfil — os mesmos números de sempre
 * (ver `features/stats/calculations.ts`), só que reduzidos a 4, pra caber
 * num modal sem virar uma segunda tela de estatísticas. */
export async function getProfileOverview(): Promise<ProfileOverview> {
  const [tasks, focusHistory, habits] = await Promise.all([
    getTaskFetcher().loadAll(),
    getFocusFetcher().loadHistoryInRange(dayjs().subtract(7, "day").toDate()),
    getHabitFetcher().loadAll(),
  ]);

  const taskStats = calculateTaskStats(tasks);

  return {
    tasksCompletedThisWeek: taskStats.completedThisWeek,
    completionRate: taskStats.completionRate,
    focusHours: calculateWeeklyFocusHours(focusHistory),
    bestHabitStreak: calculateBestHabitStreak(habits),
  };
}
