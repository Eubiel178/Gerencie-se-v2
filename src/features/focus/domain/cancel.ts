// Cancela uma sessão em andamento antes do tempo planejado — nunca ganha
// XP (ver `LocalFocusSession`), mas fica registrada no histórico com a
// duração real até o cancelamento.
export type CancelFocusSession = {
  cancel: (params: CancelFocusSession.Params) => Promise<void>;
};

export namespace CancelFocusSession {
  export type Params = { id: string };
}
