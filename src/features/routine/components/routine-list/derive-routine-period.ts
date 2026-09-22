import { IRoutineItem } from "@/features/routine/domain";

export type RoutinePeriod = "manha" | "tarde" | "noite";

export const ROUTINE_PERIOD_LABELS: Record<RoutinePeriod, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export function deriveRoutinePeriod(time: string): RoutinePeriod {
  const hour = Number(time.split(":")[0]);
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

export interface RoutinePeriodGroup {
  /** `null` = não vale a pena agrupar (todos os itens caem no mesmo
   * período) - mostrar divisores nesse caso seria uma seção artificial
   * sem nenhuma informação nova (pedido explícito: "não criar seções
   * artificiais quando elas não agregam valor"). */
  period: RoutinePeriod | null;
  items: IRoutineItem[];
}

/**
 * Agrupa os itens (já vindos ordenados por horário — ver `LoadAllRoutineItems`)
 * em blocos contíguos por período do dia. Só produz grupos DE VERDADE
 * quando a rotina realmente atravessa mais de um período - uma rotina
 * inteira de manhã, por exemplo, não ganha um único cabeçalho "Manhã"
 * sozinho.
 */
export function groupRoutineItemsByPeriod(items: IRoutineItem[]): RoutinePeriodGroup[] {
  if (items.length === 0) return [];

  const distinctPeriods = new Set(items.map((item) => deriveRoutinePeriod(item.time)));
  if (distinctPeriods.size <= 1) {
    return [{ period: null, items }];
  }

  const groups: RoutinePeriodGroup[] = [];
  let current: RoutinePeriodGroup | null = null;
  for (const item of items) {
    const period = deriveRoutinePeriod(item.time);
    if (!current || current.period !== period) {
      current = { period, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}
