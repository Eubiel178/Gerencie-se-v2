export interface IEvent {
  id: string;
  // Dono do evento. Nunca é definido a partir de um valor vindo do cliente —
  // sempre resolvido no servidor a partir da sessão autenticada (ver
  // `requireUserId()` em `src/lib/require-user-id.ts`).
  userId: string;
  end?: string;
  url?: string;
  title: string;
  start: string;
  description: string;
  backgroundColor?: string;
}
