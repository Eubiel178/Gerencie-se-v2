import { IRunningSession } from "./running-session";

// Diferente de `loadAll` (limitado às últimas 30 corridas, pra lista de
// histórico) — aqui o limite é uma DATA, sem cortar corridas por
// quantidade. Necessário pra estatísticas por semana, mesmo padrão de
// `LoadFocusHistoryInRange`.
export type LoadRunningHistoryInRange = {
  loadHistoryInRange: (since: Date) => Promise<IRunningSession[]>;
};
