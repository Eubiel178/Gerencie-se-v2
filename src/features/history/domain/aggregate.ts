import { IGoal } from "@/features/goals/domain";
import { IReadingItem } from "@/features/reading/domain";
import { ITask } from "@/features/tasks/domain";

import { HistoryEntry, HistoryEntryType, HistoryFilter, HistoryPeriod } from "./types";

const MAX_HISTORY_ENTRIES = 100;

/**
 * Converte um período ("7d" ou "30d") em Date de início do intervalo.
 * Sempre em UTC para manter consistência entre servidor e cliente.
 * `"all"` retorna `null` — sem limite inferior, lista o período inteiro.
 */
function periodToDate(period: HistoryPeriod): Date | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : 30;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Normaliza uma tarefa concluída em HistoryEntry.
 * Só entra aqui tarefas com `completed === true` e `completedAt` não nulo.
 */
function normalizeTask(task: ITask): HistoryEntry | null {
  if (!task.completed || !task.completedAt) return null;
  return {
    id: task.id,
    type: "task",
    title: task.title,
    completedAt: task.completedAt,
  };
}

/**
 * Normaliza um objetivo efetivamente concluído em HistoryEntry.
 *
 * Um objetivo é considerado concluído quando:
 * - `completionOverride === true` (conclusão manual), ou
 * - `progressPercent === 100` (etapas concluídas).
 *
 * Em ambos os casos, `completedAt` é a fonte do timestamp. O agente
 * anterior já garante que `completedAt` seja persistido corretamente em
 * `LocalGoal.setCompletion` (manual) e em `updateStep` (quando as etapas
 * chegam a 100%). Se o objetivo deixar de estar concluído, o
 * `completedAt` é limpo em conjunto, então o Histórico reflete o novo
 * estado.
 */
function normalizeGoal(goal: IGoal): HistoryEntry | null {
  const isCompleted = goal.completionOverride === true || goal.progressPercent >= 100;
  if (!isCompleted || !goal.completedAt) return null;
  return {
    id: goal.id,
    type: "goal",
    title: goal.title,
    completedAt: goal.completedAt,
    // Só mostra a porcentagem quando o objetivo tem etapas de verdade —
    // um objetivo concluído manualmente (sem etapas) sempre tem
    // `progressPercent === 0` por definição (nada pra calcular), então
    // mostrar "0%" ao lado de um item já concluído seria enganoso.
    metadata: goal.steps.length > 0 ? { goalProgress: goal.progressPercent } : undefined,
  };
}

/**
 * Normaliza um livro concluído em HistoryEntry.
 * Só entra aqui livros com `status === "finished"` e `finishedAt` não nulo.
 */
function normalizeReading(item: IReadingItem): HistoryEntry | null {
  if (item.status !== "finished" || !item.finishedAt) return null;
  return {
    id: item.id,
    type: "reading",
    title: item.title,
    completedAt: item.finishedAt,
    metadata: { author: item.author },
  };
}

export interface HistoryFetcher {
  loadEntries(query: { period: HistoryPeriod; type: HistoryFilter }): Promise<HistoryEntry[]>;
}

export function createHistoryFetcher(deps: {
  loadCompletedTasks: () => Promise<ITask[]>;
  loadCompletedGoals: () => Promise<IGoal[]>;
  loadFinishedReading: () => Promise<IReadingItem[]>;
  loadHabitCompletionsInRange: (since: Date) => Promise<{
    habitId: string;
    habitTitle: string;
    date: string;
    completedAt: Date;
  }[]>;
  loadRoutineCompletionsInRange: (since: Date) => Promise<{
    routineItemId: string;
    routineItemTitle: string;
    date: string;
    completedAt: Date;
  }[]>;
}): HistoryFetcher {
  return {
    async loadEntries(query) {
      const since = periodToDate(query.period);
      // Fetchers de hábito/rotina exigem uma data — sem limite ("all"),
      // usa a época Unix, que na prática cobre todo o histórico real.
      const rangeSince = since ?? new Date(0);
      const [tasks, goals, reading, habits, routines] = await Promise.all([
        deps.loadCompletedTasks(),
        deps.loadCompletedGoals(),
        deps.loadFinishedReading(),
        deps.loadHabitCompletionsInRange(rangeSince),
        deps.loadRoutineCompletionsInRange(rangeSince),
      ]);

      const entries: HistoryEntry[] = [];
      const isWithinPeriod = (date: Date) => !since || date >= since;

      for (const task of tasks) {
        const entry = normalizeTask(task);
        if (
          entry &&
          (query.type === "all" || query.type === "task") &&
          isWithinPeriod(entry.completedAt)
        )
          entries.push(entry);
      }

      for (const goal of goals) {
        const entry = normalizeGoal(goal);
        if (
          entry &&
          (query.type === "all" || query.type === "goal") &&
          isWithinPeriod(entry.completedAt)
        )
          entries.push(entry);
      }

      for (const item of reading) {
        const entry = normalizeReading(item);
        if (
          entry &&
          (query.type === "all" || query.type === "reading") &&
          isWithinPeriod(entry.completedAt)
        )
          entries.push(entry);
      }

      if (query.type === "all" || query.type === "habit") {
        for (const log of habits) {
          entries.push({
            id: `${log.habitId}:${log.date}`,
            type: "habit",
            title: log.habitTitle,
            completedAt: log.completedAt,
          });
        }
      }

      if (query.type === "all" || query.type === "routine") {
        for (const log of routines) {
          entries.push({
            id: `${log.routineItemId}:${log.date}`,
            type: "routine",
            title: log.routineItemTitle,
            completedAt: log.completedAt,
          });
        }
      }

      // Ordenação estável: mais recentes primeiro. Em caso de empate
      // exato, mantém a ordem de entrada (não há critério secundário
      // confiável além do completedAt).
      entries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

      return entries.slice(0, MAX_HISTORY_ENTRIES);
    },
  };
}