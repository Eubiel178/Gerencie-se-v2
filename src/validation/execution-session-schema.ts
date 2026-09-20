import { z } from "zod";

export const startExecutionSessionSchema = z.object({
  taskId: z.string().min(1),
});

export const executionActionSchema = z.object({
  sessionId: z.string().min(1),
});
