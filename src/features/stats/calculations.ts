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

/** Mesma ideia de `calculateWeeklyFocusHours`, repetida por `weeksBack`
 * janelas de 7 dias — a mais antiga primeiro, a semana atual por
 * último (ordem de leitura de um gráfico de barras). Diferente da
 * função acima, cada janela aqui tem início E fim (não dá pra reusar
 * `calculateWeeklyFocusHours` direto: ela só limita o início, o que só
 * funciona pra janela mais recente). */
export function calculateWeeklyFocusHoursByWeek(
  sessions: IFocusSession[],
  weeksBack: number = 4,
  now: Dayjs = dayjs()
): number[] {
  const weeks: number[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekEnd = now.subtract(i * STATS_WINDOW_DAYS, "day");
    const weekStart = weekEnd.subtract(STATS_WINDOW_DAYS, "day");

    const totalSeconds = sessions
      .filter(
        (session) =>
          session.status === "completed" &&
          dayjs(session.startedAt).isAfter(weekStart) &&
          dayjs(session.startedAt).isBefore(weekEnd)
      )
      .reduce((sum, session) => sum + (session.actualDurationSeconds ?? 0), 0);

    weeks.push(Math.round((totalSeconds / 3600) * 10) / 10);
  }

  return weeks;
}

/** Quantos dos últimos 7 dias bateram a meta diária de hidratação. */
export function calculateHydrationAdherence(week: IHydrationDay[], goalMl: number): number {
  if (goalMl <= 0) return 0;
  return week.filter((day) => day.totalMl >= goalMl).length;
}

/** Mesma ideia de `calculateWeeklyFocusHoursByWeek`, pra hidratação: quantos
 * dias bateram a meta em cada uma das `weeksBack` semanas (mais antiga
 * primeiro). `days` precisa cobrir toda a janela pedida (ver
 * `LocalHydration.loadRange`). */
export function calculateHydrationAdherenceByWeek(
  days: IHydrationDay[],
  goalMl: number,
  weeksBack: number = 4,
  now: Dayjs = dayjs()
): number[] {
  if (goalMl <= 0) return new Array(weeksBack).fill(0);

  const weeks: number[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekEnd = now.subtract(i * STATS_WINDOW_DAYS, "day");
    const weekStart = weekEnd.subtract(STATS_WINDOW_DAYS, "day");

    const hitCount = days.filter((day) => {
      const date = dayjs(day.date);
      return date.isAfter(weekStart) && !date.isAfter(weekEnd) && day.totalMl >= goalMl;
    }).length;

    weeks.push(hitCount);
  }

  return weeks;
}

export function calculateBestHabitStreak(habits: { currentStreak: number }[]): number {
  return habits.reduce((max, habit) => Math.max(max, habit.currentStreak), 0);
}

/** Quantas conclusões de hábito (somando todos os hábitos ativos)
 * aconteceram em cada uma das `weeksBack` semanas — mesma ideia do
 * gráfico de foco, mas contando registros de `habit_log` em vez de
 * horas. `dates` vem de `LoadHabitCompletionsInRange`. */
export function calculateHabitCompletionsByWeek(
  dates: string[],
  weeksBack: number = 4,
  now: Dayjs = dayjs()
): number[] {
  const weeks: number[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekEnd = now.subtract(i * STATS_WINDOW_DAYS, "day");
    const weekStart = weekEnd.subtract(STATS_WINDOW_DAYS, "day");

    const count = dates.filter((rawDate) => {
      const date = dayjs(rawDate);
      return date.isAfter(weekStart) && !date.isAfter(weekEnd);
    }).length;

    weeks.push(count);
  }

  return weeks;
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

/** Mesma ideia de `calculateWeeklyFocusHoursByWeek`, pra corrida: distância
 * (km) somada em cada uma das `weeksBack` semanas. */
export function calculateWeeklyRunningDistanceByWeek(
  sessions: { startedAt: Date; distanceMeters: number }[],
  weeksBack: number = 4,
  now: Dayjs = dayjs()
): number[] {
  const weeks: number[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekEnd = now.subtract(i * STATS_WINDOW_DAYS, "day");
    const weekStart = weekEnd.subtract(STATS_WINDOW_DAYS, "day");

    const distanceMeters = sessions
      .filter((session) => dayjs(session.startedAt).isAfter(weekStart) && dayjs(session.startedAt).isBefore(weekEnd))
      .reduce((sum, session) => sum + session.distanceMeters, 0);

    weeks.push(Math.round((distanceMeters / 1000) * 10) / 10);
  }

  return weeks;
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

/** Quantas metas (ativas — arquivadas já nem chegam de `loadAll`) foram
 * criadas em cada uma das `weeksBack` semanas. Diferente das outras
 * métricas de "por semana": metas não têm um valor histórico acumulável
 * (progresso é sempre o valor ATUAL, não guardado por data — ver
 * `calculateGoalProgress`), então "quantas foram criadas" é a única
 * dimensão de verdade temporal e real que o dado permite. */
export function calculateGoalsCreatedByWeek(
  goals: { createdAt: Date }[],
  weeksBack: number = 4,
  now: Dayjs = dayjs()
): number[] {
  const weeks: number[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekEnd = now.subtract(i * STATS_WINDOW_DAYS, "day");
    const weekStart = weekEnd.subtract(STATS_WINDOW_DAYS, "day");

    const count = goals.filter((goal) => {
      const date = dayjs(goal.createdAt);
      return date.isAfter(weekStart) && !date.isAfter(weekEnd);
    }).length;

    weeks.push(count);
  }

  return weeks;
}
