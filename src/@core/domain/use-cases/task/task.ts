export type TaskSyncStatus = "NONE" | "PENDING" | "SYNCED" | "ERROR";

export interface ITask {
  id: string;
  // Dono da tarefa. Nunca é definido a partir de um valor vindo do cliente —
  // sempre resolvido no servidor a partir da sessão autenticada (ver
  // `requireUserId()` em `src/lib/require-user-id.ts`).
  userId: string;
  tag: string;
  title: string;
  description: string;

  // Data/hora agendada (formato de `<input type="datetime-local">`, ex.
  // "2026-10-01T14:30"). Opcional para uma tarefa comum; obrigatória no
  // formulário só quando `syncEnabled` está marcado, pois é o que vira o
  // horário do evento no Google Agenda.
  scheduledAt?: string;

  // Sincronização opcional com o Google Agenda — sempre por tarefa, nunca
  // obrigatória. Ver `src/lib/google-calendar.ts` e
  // `src/features/tasks/actions.ts`.
  syncEnabled: boolean;
  syncStatus: TaskSyncStatus;
  syncError?: string | null;
  googleEventId?: string | null;
  // "updated" que o Google reportou da última vez que lemos o evento —
  // usado só internamente pelo polling Google→App para saber se o evento
  // mudou desde a última sincronização.
  googleEventUpdatedAt?: Date | null;
}
