/**
 * Cuidados preventivos (check-ups, vacinas, exames de rotina) — só
 * lembretes e organização. NUNCA um diagnóstico, e o app nunca deve ser
 * apresentado como substituto de acompanhamento médico. `nextDueDate` é
 * uma estimativa simples (última vez + intervalo), não uma recomendação
 * clínica.
 */
export interface IHealthCheckup {
  id: string;
  userId: string;
  title: string;
  category: string;
  intervalDays?: number | null;
  lastDoneAt?: string | null; // "YYYY-MM-DD"
  notes?: string | null;

  // Calculado a partir de lastDoneAt + intervalDays — nunca guardado.
  // `null` quando não há intervalo definido (item sem recorrência).
  nextDueDate: string | null;
  isOverdue: boolean;
}
