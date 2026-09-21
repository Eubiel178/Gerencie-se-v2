import "server-only";

import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";

import { HistoryEntry, HistoryFilter, HistoryPeriod, createHistoryFetcher } from "../domain";

export type { HistoryEntry, HistoryFilter, HistoryPeriod };

/**
 * Implementação server-side do Histórico. Agrega dados dos domínios
 * existentes em uma única lista normalizada, sem criar nova fonte de
 * verdade, nova tabela, store paralela ou localStorage.
 *
 * Cada entrada deriva diretamente de uma linha real já persistida:
 * - task.completed === true  → task.completedAt
 * - goal concluído            → goal.completedAt
 * - habit_log                → habit_log.completedAt
 * - routine_item_log         → routine_item_log.completedAt
 * - reading_item.status=done → reading_item.finishedAt
 */
export class LocalHistory {
  async loadEntries(params: {
    period: HistoryPeriod;
    type: HistoryFilter;
  }): Promise<HistoryEntry[]> {
    const taskFetcher = getTaskFetcher();
    const goalFetcher = getGoalFetcher();
    const readingFetcher = getReadingFetcher();
    const habitFetcher = getHabitFetcher();
    const routineFetcher = getRoutineFetcher();

    const fetcher = createHistoryFetcher({
      loadCompletedTasks: async () => {
        const all = await taskFetcher.loadAll();
        return all.filter((t) => t.completed && t.completedAt);
      },
      loadCompletedGoals: async () => {
        const all = await goalFetcher.loadAll();
        return all.filter(
          (g) =>
            (g.completionOverride === true || g.progressPercent >= 100) &&
            g.completedAt != null
        );
      },
      loadFinishedReading: async () => {
        const all = await readingFetcher.loadAll();
        return all.filter((r) => r.status === "finished" && r.finishedAt != null);
      },
      loadHabitCompletionsInRange: (since: Date) =>
        habitFetcher.loadHabitCompletionsInRange(since),
      loadRoutineCompletionsInRange: (since: Date) =>
        routineFetcher.loadRoutineItemLogsInRange(since),
    });

    return fetcher.loadEntries(params);
  }
}

export function getHistoryFetcher() {
  return new LocalHistory();
}