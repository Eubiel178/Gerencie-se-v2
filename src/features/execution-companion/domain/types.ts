export type ExecutionSessionStatus = "active" | "paused" | "completed" | "abandoned";

export interface IExecutionSession {
  id: string;
  userId: string;
  taskId: string;
  status: ExecutionSessionStatus;
  currentStepIndex: number;
  startedAt: Date;
  resumedAt: Date;
  pausedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
  lastCheckinSentAt: Date | null;
}
