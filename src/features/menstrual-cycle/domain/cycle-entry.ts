/**
 * Cada linha é o início de um ciclo relatado pelo próprio usuário. Duração
 * média e previsão do próximo ciclo (ver `ICycleEstimate`) são sempre
 * calculadas a partir daqui, nunca guardadas, e sempre apresentadas como
 * ESTIMATIVA — nunca certeza, e nunca diagnóstico.
 */
export interface ICycleEntry {
  id: string;
  userId: string;
  startDate: string; // "YYYY-MM-DD"
  periodLengthDays?: number | null;
  symptoms: string[];
  notes?: string | null;
  createdAt: Date;
}
