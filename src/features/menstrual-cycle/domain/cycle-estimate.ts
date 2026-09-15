import dayjs from "dayjs";

import { ICycleEntry } from "./cycle-entry";

// Estimativa calculada a partir do histórico de `ICycleEntry` — nunca
// guardada, e sempre rotulada como estimativa na interface. `null` em
// qualquer campo quando não há histórico suficiente (menos de 2 registros
// pra calcular uma média de duração).
export interface ICycleEstimate {
  averageCycleLengthDays: number | null;
  nextEstimatedStartDate: string | null;
  currentCycleDay: number | null;
}

export function calculateCycleEstimate(
  entries: ICycleEntry[],
  today: dayjs.Dayjs = dayjs()
): ICycleEstimate {
  if (entries.length === 0) {
    return { averageCycleLengthDays: null, nextEstimatedStartDate: null, currentCycleDay: null };
  }

  // `entries` pode vir em qualquer ordem; precisamos do mais antigo primeiro
  // pra calcular os intervalos entre inícios consecutivos.
  const sortedAsc = [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const gaps: number[] = [];
  for (let i = 1; i < sortedAsc.length; i++) {
    gaps.push(dayjs(sortedAsc[i].startDate).diff(dayjs(sortedAsc[i - 1].startDate), "day"));
  }

  const averageCycleLengthDays =
    gaps.length > 0 ? Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length) : null;

  const lastStart = sortedAsc[sortedAsc.length - 1].startDate;
  const currentCycleDay = today.diff(dayjs(lastStart), "day") + 1;

  const nextEstimatedStartDate = averageCycleLengthDays
    ? dayjs(lastStart).add(averageCycleLengthDays, "day").format("YYYY-MM-DD")
    : null;

  return { averageCycleLengthDays, nextEstimatedStartDate, currentCycleDay };
}
