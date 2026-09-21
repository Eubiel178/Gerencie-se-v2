import dayjs, { Dayjs } from "dayjs";

import { IconName } from "@/components";

export interface AchievementStats {
  tasksCompletedTotal: number;
  // "Começar também conta" (Modo Assistido): total histórico de tarefas
  // que já foram iniciadas ao menos uma vez, concluídas ou não — ver
  // `ITask.startedAt`.
  tasksStartedTotal: number;
  habitsCreatedTotal: number;
  bestHabitStreak: number;
  goalsCompletedTotal: number;
  hasFullWeek: boolean;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  isUnlocked: (stats: AchievementStats) => boolean;
}

/** Cada condição olha só pro TOTAL histórico (nunca "desta semana") — uma
 * conquista, uma vez desbloqueada, nunca é perdida (ver
 * `achievement_unlock`, que só registra quando, nunca se ainda vale). */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-task",
    name: "Primeiro passo",
    description: "Concluiu sua primeira tarefa.",
    icon: "FaCheck",
    isUnlocked: (stats) => stats.tasksCompletedTotal >= 1,
  },
  {
    id: "ten-tasks",
    name: "Ganhando ritmo",
    description: "Concluiu 10 tarefas.",
    icon: "FaListUl",
    isUnlocked: (stats) => stats.tasksCompletedTotal >= 10,
  },
  {
    id: "hundred-tasks",
    name: "Cem por cento presente",
    description: "Concluiu 100 tarefas.",
    icon: "FaTrophy",
    isUnlocked: (stats) => stats.tasksCompletedTotal >= 100,
  },
  {
    id: "first-start",
    name: "Deu o start",
    description: "Começou uma tarefa (terminar depois é só bônus).",
    icon: "FaPlay",
    isUnlocked: (stats) => stats.tasksStartedTotal >= 1,
  },
  {
    id: "five-starts",
    name: "No embalo",
    description: "Começou 5 tarefas.",
    icon: "FaPlay",
    isUnlocked: (stats) => stats.tasksStartedTotal >= 5,
  },
  {
    id: "first-habit",
    name: "Novo costume",
    description: "Criou seu primeiro hábito.",
    icon: "FaFire",
    isUnlocked: (stats) => stats.habitsCreatedTotal >= 1,
  },
  {
    id: "streak-7",
    name: "Uma semana de sequência",
    description: "Manteve um hábito por 7 dias seguidos.",
    icon: "FaFire",
    isUnlocked: (stats) => stats.bestHabitStreak >= 7,
  },
  {
    id: "streak-30",
    name: "Um mês de sequência",
    description: "Manteve um hábito por 30 dias seguidos.",
    icon: "FaFire",
    isUnlocked: (stats) => stats.bestHabitStreak >= 30,
  },
  {
    id: "first-goal-done",
    name: "Objetivo cumprido",
    description: "Concluiu 100% de um objetivo.",
    icon: "FaBullseye",
    isUnlocked: (stats) => stats.goalsCompletedTotal >= 1,
  },
  {
    id: "full-week",
    name: "Semana completa",
    description: "Concluiu ao menos uma tarefa em cada um dos últimos 7 dias.",
    icon: "FaCalendarCheck",
    isUnlocked: (stats) => stats.hasFullWeek,
  },
];

/** "Semana completa" = os últimos 7 dias (hoje incluso) têm, cada um, ao
 * menos uma tarefa concluída naquele dia. Função pura, testável sem
 * banco. */
export function calculateHasFullWeek(
  completedDates: (Date | string)[],
  now: Dayjs = dayjs()
): boolean {
  const completedDayKeys = new Set(completedDates.map((date) => dayjs(date).format("YYYY-MM-DD")));

  for (let i = 0; i < 7; i++) {
    const dayKey = now.subtract(i, "day").format("YYYY-MM-DD");
    if (!completedDayKeys.has(dayKey)) return false;
  }

  return true;
}
