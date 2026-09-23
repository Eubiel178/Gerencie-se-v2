import { IFocusSession } from "./focus-session";

// Diferente de `LoadFocusHistory` (últimas 10 sessões, pra lista de
// histórico do Focus): aqui o limite é uma DATA, não uma quantidade —
// necessário pra estatísticas por semana (Stats), onde um usuário com mais
// de 10 sessões nas últimas semanas não pode ter semanas mais antigas
// silenciosamente cortadas.
export type LoadFocusHistoryInRange = {
  loadHistoryInRange: (since: Date) => Promise<IFocusSession[]>;
};
