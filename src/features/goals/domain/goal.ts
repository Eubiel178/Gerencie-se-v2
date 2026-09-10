import { IGoalStep } from "./goal-step";

export type GoalPriority = "baixa" | "media" | "alta" | "critica";

export interface IGoal {
  id: string;
  // Dono do objetivo. Nunca vem do cliente — sempre resolvido no servidor
  // a partir da sessão autenticada.
  userId: string;
  title: string;
  description: string;
  deadline?: string | null; // "YYYY-MM-DD"
  priority: GoalPriority;
  archived: boolean;
  createdAt: Date;

  // Etapas do objetivo, sempre carregadas junto (ver `LocalGoal.loadAll`) —
  // um objetivo sem etapas próprias não faz sentido de exibir sozinho.
  steps: IGoalStep[];

  // Calculado a partir de `steps` a cada `loadAll()` — nunca guardado (ver
  // comentário do schema em `src/db/schema.ts`). 0 quando não há etapas.
  progressPercent: number;

  // Compartilhamento (ver `assertAcceptedConnection`): quem esse objetivo
  // foi compartilhado pode ver/editar/gerenciar etapas, mas só o dono pode
  // mudar isso ou excluir o objetivo.
  sharedWithUserId?: string | null;
  isSharedWithMe: boolean;
  ownerLabel?: string | null;
}
