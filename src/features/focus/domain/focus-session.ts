export type FocusSessionStatus = "running" | "completed" | "cancelled";

export interface IFocusSession {
  id: string;
  // Dono da sessão. Nunca vem do cliente — sempre resolvido no servidor a
  // partir da sessão autenticada.
  userId: string;
  startedAt: Date;
  endedAt?: Date | null;
  plannedDurationSeconds: number;
  actualDurationSeconds?: number | null;
  status: FocusSessionStatus;
  xpEarned: number;
}
