/**
 * Ocorrências concluídas de rotina com identidade (título) — usado pelo
 * Histórico, onde cada dia é uma entrada independente e o nome do item de
 * rotina é parte do que o usuário precisa ver. O mesmo item pode aparecer
 * em vários dias, e cada dia é uma entrada independente.
 */
export type LoadRoutineItemLogsInRange = {
  loadRoutineItemLogsInRange(since: Date): Promise<RoutineLogEntry[]>;
};

export type RoutineLogEntry = {
  routineItemId: string;
  routineItemTitle: string;
  date: string; // "YYYY-MM-DD"
  completedAt: Date;
};