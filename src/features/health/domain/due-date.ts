import dayjs from "dayjs";

export interface CheckupDueState {
  nextDueDate: string | null;
  isOverdue: boolean;
}

/**
 * Estimativa simples de próxima data (última vez + intervalo) — nunca uma
 * recomendação clínica (ver comentário em `health-checkup.ts`). `null`/`false`
 * quando o item não tem `lastDoneAt` ou `intervalDays` definidos (sem
 * recorrência configurada ainda).
 */
export function computeCheckupDueState(
  lastDoneAt: string | null | undefined,
  intervalDays: number | null | undefined,
  today: dayjs.Dayjs = dayjs()
): CheckupDueState {
  if (!lastDoneAt || !intervalDays) {
    return { nextDueDate: null, isOverdue: false };
  }

  const due = dayjs(lastDoneAt).add(intervalDays, "day");

  return {
    nextDueDate: due.format("YYYY-MM-DD"),
    isOverdue: due.isBefore(today, "day"),
  };
}
