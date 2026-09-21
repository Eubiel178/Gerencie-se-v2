export type DisplayStatus = "idle" | "executing" | "paused" | "completed";

export type CardWorkStatus = "pending" | "in_progress" | "paused";

interface DeriveDisplayStatusParams {
  completed: boolean;
  workStatus: CardWorkStatus;
  isExecuting: boolean;
}

/**
 * `workStatus` (task store) e `isExecuting` (derivado do execution-companion
 * store) atualizam em momentos ligeiramente diferentes durante pause/resume
 * (dois `await`s separados em `use-task-card-actions.ts`) — `workStatus` é a
 * fonte primária pra decidir "pausada vs. executando" pra nunca existir um
 * instante em que um já mudou e o outro ainda não caia em "idle" (oculto),
 * o que fazia o badge sumir e reaparecer entre dois estados visíveis.
 * `isExecuting` entra como reforço, nunca como condição única.
 */
export function deriveDisplayStatus({
  completed,
  workStatus,
  isExecuting,
}: DeriveDisplayStatusParams): DisplayStatus {
  if (completed) return "completed";
  if (workStatus === "paused") return "paused";
  if (workStatus === "in_progress" || isExecuting) return "executing";
  return "idle";
}
