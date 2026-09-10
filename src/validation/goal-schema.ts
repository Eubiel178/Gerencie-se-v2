import { z } from "zod";

export const validationSchema = z.object({
  title: z
    .string()
    .min(1, "Campo obrigatório")
    .max(60, "O título deve ter no máximo 60 caracteres"),
  description: z
    .string()
    .max(280, "A descrição deve ter no máximo 280 caracteres"),
  deadline: z.string().optional(),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  // "" no formulário = não compartilhado.
  sharedWithUserId: z.string().optional(),
});

// Revalidação no servidor (Server Action) do mesmo formato acima — o
// formulário já valida no cliente, mas a Server Action é um endpoint
// público e não pode confiar só nisso.
export const createGoalSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(60, "Título muito longo"),
  description: z.string().max(280, "Descrição muito longa"),
  deadline: z.string().optional().nullable(),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  sharedWithUserId: z.string().optional().nullable(),
});

export const updateGoalSchema = createGoalSchema.extend({
  id: z.string().min(1),
});

export const createGoalStepSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().min(1, "Campo obrigatório").max(120, "Título muito longo"),
});

export const updateGoalStepSchema = z.object({
  id: z.string().min(1),
  completed: z.boolean(),
});
