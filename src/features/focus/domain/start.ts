import { IFocusSession } from "./focus-session";

// Nunca cria uma segunda sessão "running" pro mesmo usuário — se já existe
// uma em andamento, a implementação devolve ela em vez de criar outra (só
// existe um foco por vez).
export type StartFocusSession = {
  start: (params: StartFocusSession.Params) => Promise<StartFocusSession.Result>;
};

export namespace StartFocusSession {
  export type Params = { plannedDurationSeconds: number; taskId?: string | null };

  // Inclui `taskId` de propósito: como uma sessão já em andamento é
  // devolvida em vez de criar outra (ver comentário acima), quem chama
  // precisa saber a que tarefa a sessão RESULTANTE está associada - pode
  // não ser a mesma que foi pedida em `Params`, se já havia uma sessão
  // rodando pra outra tarefa (ou nenhuma).
  export type Result = Pick<IFocusSession, "id" | "startedAt" | "plannedDurationSeconds" | "taskId">;
}
