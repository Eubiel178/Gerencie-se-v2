// Marca a sessão como concluída, calcula a duração real (agora - início) e
// o XP ganho (ver `LocalFocusSession`). Não mexe no mascote — quem soma o
// XP ganho ao total do mascote é a orquestração em `actions.ts`, igual ao
// padrão já usado pra sincronização com o Google Agenda em
// `features/tasks/actions.ts`.
export type CompleteFocusSession = {
  complete: (params: CompleteFocusSession.Params) => Promise<CompleteFocusSession.Result>;
};

export namespace CompleteFocusSession {
  export type Params = { id: string };

  export type Result = { xpEarned: number; actualDurationSeconds: number };
}
