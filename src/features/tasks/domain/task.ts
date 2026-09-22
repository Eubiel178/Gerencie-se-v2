import { ITaskStep } from "./task-step";

export type TaskSyncStatus = "NONE" | "PENDING" | "SYNCED" | "ERROR";
export type TaskPriority = "baixa" | "media" | "alta" | "critica";
export type TaskRecurrence = "none" | "daily" | "weekly";
export type TaskWorkStatus = "pending" | "in_progress" | "paused";

export interface ITask {
  id: string;
  // Dono da tarefa. Nunca é definido a partir de um valor vindo do cliente —
  // sempre resolvido no servidor a partir da sessão autenticada (ver
  // `requireUserId()` em `src/lib/require-user-id.ts`).
  userId: string;
  tag: string;
  title: string;
  description: string;
  priority: TaskPriority;

  // Conclusão — alternada por `ToggleTaskComplete`, nunca pelo formulário
  // de edição geral (mesmo raciocínio de `syncStatus` abaixo: um estado
  // gerido por uma ação dedicada, não por um campo de formulário comum).
  completed: boolean;
  completedAt?: Date | null;
  // Estado atual de início: nulo = ainda não iniciada. A pessoa pode
  // desfazer o início sem apagar o XP histórico recebido ao começar.
  startedAt?: Date | null;
  /** Estado atual, separado do registro histórico de quando a tarefa foi
   * iniciada pela primeira vez. */
  workStatus?: TaskWorkStatus;
  // Quando esta tarefa foi pausada pela última vez - direto na task (ver
  // comentário completo em `src/db/schema.ts`), pra sobreviver mesmo
  // depois que outra tarefa vira a sessão de execução rastreada.
  pausedAt?: Date | null;
  // "Quebrar em passos menores" (Modo Assistido) — sempre carregado
  // junto (mesmo raciocínio de `IGoal.steps`), nunca gerado sozinho.
  steps: ITaskStep[];
  attachmentCount?: number;

  // Data/hora agendada (formato de `<input type="datetime-local">`, ex.
  // "2026-10-01T14:30"). Opcional para uma tarefa comum; obrigatória no
  // formulário só quando `syncEnabled` está marcado, pois é o que vira o
  // horário do evento no Google Agenda.
  scheduledAt?: string;

  // Minutos de antecedência para lembrete (ex.: [1440, 5, 0] = 1 dia
  // antes, 5 min antes, na hora). Só faz sentido com `scheduledAt`
  // definido. `null`/vazio = sem lembrete. Disparado no navegador via
  // Notification API enquanto o app estiver aberto (ver
  // `features/tasks/components/reminder-scheduler`) — sem um servidor de
  // push, não é possível notificar com o app fechado; limitação
  // documentada na própria UI de lembretes.
  reminderOffsetsMinutes?: number[] | null;

  // Recorrência simples (não é um motor de RRULE): ao concluir uma tarefa
  // recorrente, `ToggleTaskComplete` cria a próxima ocorrência deslocando
  // `scheduledAt` em vez de gerar todas as instâncias futuras de uma vez.
  // Só faz sentido com `scheduledAt` definido (não há o que deslocar sem
  // uma data).
  recurrence: TaskRecurrence;

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

  // Compartilhamento com UMA conta conectada (ver features/connections) —
  // dono continua sendo `userId`; quem está aqui só pode ver/editar/
  // concluir, nunca excluir (ver `LocalTask.delete`). `null` = privada.
  sharedWithUserId?: string | null;
  // Calculados a partir de quem está logado (nunca guardados): se a
  // tarefa listada é minha ou de alguém que compartilhou comigo, e o
  // nome/e-mail de quem compartilhou (só preenchido no segundo caso).
  isSharedWithMe: boolean;
  ownerLabel?: string | null;
}
