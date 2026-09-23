/**
 * Mesma linguagem relativa do prazo de Tarefas (`tasks/.../deadline-helpers.ts`
 * - "Hoje"/"Amanhã"/data curta), adaptada pra um prazo SÓ DE DATA
 * ("YYYY-MM-DD", sem hora - ver `IGoal.deadline`). Por isso não reaproveita
 * `formatDeadline`/`isOverdue` de Tarefas direto: aquelas comparam contra o
 * instante exato agora (`new Date() `), o que marcaria um objetivo com
 * prazo "hoje" como atrasado a partir da meia-noite - errado pra um prazo
 * que é só um dia, sem hora.
 */
export function formatGoalDeadline(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  if (date.getTime() === startOfToday.getTime()) return "Hoje";
  if (date.getTime() === startOfTomorrow.getTime()) return "Amanhã";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "");
}

export function isGoalOverdue(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date.getTime() < startOfToday.getTime();
}
