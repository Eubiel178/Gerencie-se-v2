export type GoalDisplayStatus = "pending" | "completed";

interface DeriveGoalDisplayStatusParams {
  /** `true`/`false` = marcado manualmente (Concluir/Reabrir venceu por
   * cima do progresso pelos passos); `null`/`undefined` = segue o
   * progresso. */
  completionOverride: boolean | null | undefined;
  progressPercent: number;
  hasSteps: boolean;
}

/**
 * Mesmo raciocínio de `deriveDisplayStatus` (Tarefas): uma ÚNICA função
 * pura decide o status a partir do estado real, em vez de booleans soltos
 * repetidos pelo componente (`isCompletedBySteps`/`isCompleted` antes
 * ficavam recalculados inline no `Card`). `completionOverride` sempre
 * vence - é a mesma regra de negócio de antes, só nomeada e testável
 * isoladamente agora.
 */
export function deriveGoalDisplayStatus({
  completionOverride,
  progressPercent,
  hasSteps,
}: DeriveGoalDisplayStatusParams): GoalDisplayStatus {
  if (completionOverride !== null && completionOverride !== undefined) {
    return completionOverride ? "completed" : "pending";
  }
  return hasSteps && progressPercent === 100 ? "completed" : "pending";
}
