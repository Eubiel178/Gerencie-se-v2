import { IFocusSession } from "./focus-session";

// Últimas sessões finalizadas (concluídas ou canceladas) do usuário, mais
// recentes primeiro — nunca inclui a sessão "running" atual.
export type LoadFocusHistory = {
  loadHistory: () => Promise<LoadFocusHistory.Model>;
};

export namespace LoadFocusHistory {
  export type Model = IFocusSession[];
}
