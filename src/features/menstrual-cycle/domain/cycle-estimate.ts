// Estimativa calculada a partir do histórico de `ICycleEntry` — nunca
// guardada, e sempre rotulada como estimativa na interface. `null` em
// qualquer campo quando não há histórico suficiente (menos de 2 registros
// pra calcular uma média de duração).
export interface ICycleEstimate {
  averageCycleLengthDays: number | null;
  nextEstimatedStartDate: string | null;
  currentCycleDay: number | null;
}
