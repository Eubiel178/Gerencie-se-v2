import { IFocusSession } from "./focus-session";

// Nunca cria uma segunda sessão "running" pro mesmo usuário — se já existe
// uma em andamento, a implementação devolve ela em vez de criar outra (só
// existe um foco por vez).
export type StartFocusSession = {
  start: (params: StartFocusSession.Params) => Promise<StartFocusSession.Result>;
};

export namespace StartFocusSession {
  export type Params = { plannedDurationSeconds: number };

  export type Result = Pick<IFocusSession, "id" | "startedAt" | "plannedDurationSeconds">;
}
