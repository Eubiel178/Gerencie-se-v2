import { z } from "zod";

export type RiskLevel = "low" | "medium" | "high";

export interface CompanionAction {
  name: string;
  description: string;
  risk: RiskLevel;
  requiresConfirmation: boolean;
  paramsSchema: z.ZodSchema;
}

// Schemas de parâmetros das actions
const CreateTaskParamsSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(60),
  description: z.string().max(280).optional(),
  tag: z.enum(["studie", "work", "exercise", "other"]).optional(),
  priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
  scheduledAt: z.string().optional(),
});

const CompleteTaskParamsSchema = z.object({
  taskId: z.string().min(1),
});

const UpdateTaskDueDateParamsSchema = z.object({
  taskId: z.string().min(1),
  scheduledAt: z.string().min(1),
});

const AddTaskStepParamsSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1, "Título do passo obrigatório").max(60),
});

const StartExecutionParamsSchema = z.object({
  taskId: z.string().min(1),
});

const UpdateTaskParamsSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1, "Título obrigatório").max(60).optional(),
  description: z.string().max(280).optional(),
  priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
  scheduledAt: z.string().optional(),
  tag: z.enum(["studie", "work", "exercise", "other"]).optional(),
});

// Registry de ações permitidas
export const COMPANION_ACTIONS: Record<string, CompanionAction> = {
  "task.create": {
    name: "task.create",
    description: "Criar uma nova tarefa",
    risk: "medium",
    requiresConfirmation: true,
    paramsSchema: CreateTaskParamsSchema,
  },
  "task.complete": {
    name: "task.complete",
    description: "Concluir uma tarefa existente",
    risk: "medium",
    requiresConfirmation: true,
    paramsSchema: CompleteTaskParamsSchema,
  },
  "task.updateDueDate": {
    name: "task.updateDueDate",
    description: "Mudar a data de uma tarefa",
    risk: "medium",
    requiresConfirmation: true,
    paramsSchema: UpdateTaskDueDateParamsSchema,
  },
  "task.update": {
    name: "task.update",
    description: "Editar campos de uma tarefa existente",
    risk: "medium",
    requiresConfirmation: true,
    paramsSchema: UpdateTaskParamsSchema,
  },
  "task.addStep": {
    name: "task.addStep",
    description: "Adicionar um passo a uma tarefa",
    risk: "low",
    requiresConfirmation: false,
    paramsSchema: AddTaskStepParamsSchema,
  },
  "task.startExecution": {
    name: "task.startExecution",
    description: "Iniciar acompanhamento de uma tarefa",
    risk: "low",
    requiresConfirmation: false,
    paramsSchema: StartExecutionParamsSchema,
  },
};

export function getCompanionAction(name: string): CompanionAction | undefined {
  return COMPANION_ACTIONS[name];
}

export function getAllCompanionActions(): CompanionAction[] {
  return Object.values(COMPANION_ACTIONS);
}
