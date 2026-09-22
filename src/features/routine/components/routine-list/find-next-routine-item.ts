import { IRoutineItem } from "@/features/routine/domain";

/**
 * Id do próximo item da rotina que ainda vale a pena destacar como
 * "a seguir": o primeiro (na ordem por horário) que ainda não foi
 * concluído hoje e cujo horário ainda não passou. `null` quando não há
 * nenhum (rotina inteira concluída, ou todos os horários já passaram) -
 * nesse caso não existe destaque nenhum, nunca um chute.
 */
export function findNextRoutineItemId(items: IRoutineItem[], nowTime: string): string | null {
  const upcoming = items.find((item) => !item.completedToday && item.time >= nowTime);
  return upcoming?.id ?? null;
}
