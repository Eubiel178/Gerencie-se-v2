// Soma minutos à duração planejada de uma sessão já em andamento (botões
// "+10"/"+20" etc.) - nunca mexe em `startedAt`, então o tempo já
// decorrido continua contando normalmente, só o alvo final que se afasta.
export type ExtendFocusSession = {
  extend: (params: ExtendFocusSession.Params) => Promise<ExtendFocusSession.Result>;
};

export namespace ExtendFocusSession {
  export type Params = { id: string; additionalSeconds: number };

  export type Result = { plannedDurationSeconds: number };
}
