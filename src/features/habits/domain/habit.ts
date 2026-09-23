export type HabitFrequency = "daily" | "weekly";

export interface IHabit {
  id: string;
  // Dono do hábito. Nunca vem do cliente — sempre resolvido no servidor a
  // partir da sessão autenticada.
  userId: string;
  title: string;
  frequency: HabitFrequency;
  // Só relevante quando frequency = "weekly" (ex.: 3x por semana).
  targetPerWeek?: number | null;
  // Vínculo opcional com um objetivo (ver `src/features/goals`).
  goalId?: string | null;
  archived: boolean;
  createdAt: Date;

  // Campos calculados a partir de `habit_log` (nunca guardados — ver
  // comentário do schema em `src/db/schema.ts`). Preenchidos por
  // `LocalHabit.loadAll()`, nunca por `create`/`update`.
  completedToday: boolean;
  // Dias consecutivos (incluindo hoje ou ontem) com registro de conclusão.
  // Só faz sentido visualmente para hábitos diários, mas é calculado para
  // todos.
  currentStreak: number;
  // Quantos registros de conclusão existem nos últimos 7 dias (incluindo
  // hoje) — usado para comparar com `targetPerWeek` em hábitos semanais.
  completionsThisWeek: number;

  // Compartilhamento (ver `assertAcceptedConnection`): quem esse hábito foi
  // compartilhado pode ver/editar/concluir, mas só o dono pode mudar isso
  // ou excluí-lo. O registro de conclusão (`habit_log`) é único por
  // (hábito, dia) — ou seja, dono e colaborador compartilham a MESMA
  // sequência/streak, não sequências separadas.
  sharedWithUserId?: string | null;
  isSharedWithMe: boolean;
  ownerLabel?: string | null;
}
