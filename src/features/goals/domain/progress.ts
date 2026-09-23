/**
 * Progresso do objetivo = etapas concluídas / total de etapas, sempre
 * calculado — nunca guardado (ver comentário do schema em
 * `src/db/schema.ts`). Função pura, sem banco, para ser testável
 * isoladamente (ver `progress.test.ts`).
 */
export function calculateGoalProgress(steps: { completed: boolean }[]): number {
  if (steps.length === 0) return 0;

  const completedCount = steps.filter((step) => step.completed).length;
  return Math.round((completedCount / steps.length) * 100);
}
