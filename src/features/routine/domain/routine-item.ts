export interface IRoutineItem {
  id: string;
  // Dono do item de rotina. Nunca vem do cliente — sempre resolvido no
  // servidor a partir da sessão autenticada (ver `requireUserId()`).
  userId: string;
  time: string; // "HH:MM"
  title: string;
  // Vínculo opcional com uma tarefa real do dia (ver `src/features/tasks`).
  // Null = item de rotina "solto", sem tarefa associada.
  taskId?: string | null;
  createdAt: Date;
  // Compartilhamento (ver `assertAcceptedConnection`): quem esse item foi
  // compartilhado pode ver/editar/concluir, mas só o dono pode mudar isso
  // ou excluir. `isSharedWithMe`/`ownerLabel` são derivados no servidor,
  // nunca persistidos.
  sharedWithUserId?: string | null;
  isSharedWithMe: boolean;
  ownerLabel?: string | null;

  // Calculado a partir de `routine_item_log` (nunca guardado — mesmo
  // raciocínio de `IHabit.completedToday`). Preenchido só por
  // `LoadAllRoutineItems`, nunca por `create`/`update`.
  completedToday: boolean;
}
