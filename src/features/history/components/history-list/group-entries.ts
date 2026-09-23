import { formatDayLabel } from "@/utils/date";

import { HistoryEntry } from "../../domain";

export type HistoryGroup = {
  label: string;
  /** Chave estável pro `key` de lista — data local (não UTC) do primeiro
   *  item do grupo. */
  date: string;
  entries: HistoryEntry[];
};

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Agrupa entradas (já ordenadas do mais recente pro mais antigo, ver
 * `aggregate.ts`) em blocos por dia local do usuário — "Hoje", "Ontem" ou
 * a data por extenso, via `formatDayLabel` (mesma função usada no chat do
 * Companion). Antes calculava em UTC na mão, o que classificava errado
 * qualquer item perto da meia-noite pra quem não está em UTC.
 */
export function groupEntriesByDay(entries: HistoryEntry[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];

  for (const entry of entries) {
    const date = entry.completedAt instanceof Date ? entry.completedAt : new Date(entry.completedAt);
    const label = formatDayLabel(date) ?? "";
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.label === label) {
      lastGroup.entries.push(entry);
    } else {
      groups.push({ label, date: localDateKey(date), entries: [entry] });
    }
  }

  return groups;
}
