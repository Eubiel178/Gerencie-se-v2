import dayjs, { Dayjs } from "dayjs";

import { ITask } from "@/features/tasks/domain";
import { IFocusSession } from "@/features/focus/domain";
import { IHydrationDay } from "@/features/hydration/domain";
import { IRunningSession } from "@/features/running/domain";

const STATS_WINDOW_DAYS = 7;

export interface TaskStats {
  completedThisWeek: number;
  overdueCount: number;
  completionRate: number;
}

/** Cada número aqui responde uma pergunta específica (nunca decorativo,
 * ver item 41 do briefing): quanto foi concluído na semana, quanto está
 * atrasado agora, e a taxa de conclusão histórica geral. */
export function calculateTaskStats(tasks: ITask[], now: Dayjs = dayjs()): TaskStats {
  const weekStart = now.subtract(STATS_WINDOW_DAYS, "day");

  const completedThisWeek = tasks.filter(
    (task) => task.completed && task.completedAt && dayjs(task.completedAt).isAfter(weekStart)
  ).length;

  const overdueCount = tasks.filter(
    (task) => !task.completed && task.scheduledAt && dayjs(task.scheduledAt).isBefore(now)
  ).length;

  const completedTotal = tasks.filter((task) => task.completed).length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completedTotal / tasks.length) * 100);

  return { completedThisWeek, overdueCount, completionRate };
}

/** Soma só sessões CONCLUÍDAS (nunca canceladas) dos últimos 7 dias,
 * arredondada para 1 casa decimal — horas, não segundos, porque é o que
 * faz sentido comunicar numa tela de estatísticas. */
export function calculateWeeklyFocusHours(sessions: IFocusSession[], now: Dayjs = dayjs()): number {
  const weekStart = now.subtract(STATS_WINDOW_DAYS, "day");

  const totalSeconds = sessions
    .filter((session) => session.status === "completed" && dayjs(session.startedAt).isAfter(weekStart))
    .reduce((sum, session) => sum + (session.actualDurationSeconds ?? 0), 0);

  return Math.round((totalSeconds / 3600) * 10) / 10;
}

/** Quantos dos últimos 7 dias bateram a meta diária de hidratação. */
export function calculateHydrationAdherence(week: IHydrationDay[], goalMl: number): number {
  if (goalMl <= 0) return 0;
  return week.filter((day) => day.totalMl >= goalMl).length;
}

export function calculateBestHabitStreak(habits: { currentStreak: number }[]): number {
  return habits.reduce((max, habit) => Math.max(max, habit.currentStreak), 0);
}

export interface WeeklyRunningStats {
  distanceKm: number;
  sessionCount: number;
}

/** Distância e contagem de corridas dos últimos 7 dias — não usa
 * `IRunningTotals` (que é all-time) porque a tela de estatísticas é
 * sempre "últimos 7 dias", e misturar as duas janelas confundiria. */
export function calculateWeeklyRunningStats(
  sessions: IRunningSession[],
  now: Dayjs = dayjs()
): WeeklyRunningStats {
  const weekStart = now.subtract(STATS_WINDOW_DAYS, "day");
  const recent = sessions.filter((session) => dayjs(session.startedAt).isAfter(weekStart));

  const distanceMeters = recent.reduce((sum, session) => sum + session.distanceMeters, 0);

  return {
    distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
    sessionCount: recent.length,
  };
}

/** Progresso médio só entre metas ATIVAS (arquivadas não contam — já
 * foram concluídas ou abandonadas, distorceriam a média). */
export function calculateAverageGoalProgress(
  goals: { progressPercent: number; archived: boolean }[]
): number {
  const active = goals.filter((goal) => !goal.archived);
  if (active.length === 0) return 0;

  return Math.round(active.reduce((sum, goal) => sum + goal.progressPercent, 0) / active.length);
}
