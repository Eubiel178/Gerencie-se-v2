import dayjs from "dayjs";

import { TaskRecurrence } from "./task";

/**
 * Calcula a data/hora da próxima ocorrência de uma tarefa recorrente,
 * deslocando `scheduledAt` em vez de gerar todas as instâncias futuras de
 * uma vez (ver comentário em `task.ts`). Função pura — sem banco — para
 * ser testável isoladamente (ver `recurrence.test.ts`).
 *
 * Retorna `null` quando não há o que deslocar (sem recorrência, ou sem
 * `scheduledAt` definido).
 */
export function computeNextOccurrence(
  scheduledAt: string | undefined | null,
  recurrence: TaskRecurrence
): string | null {
  if (recurrence === "none" || !scheduledAt) return null;

  const unit = recurrence === "daily" ? "day" : "week";
  return dayjs(scheduledAt).add(1, unit).format("YYYY-MM-DDTHH:mm");
}
