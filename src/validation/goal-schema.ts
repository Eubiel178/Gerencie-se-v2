import { z } from "zod";

// Únicas fontes de verdade pro limite de título/descrição — reaproveitadas
// pelo schema do formulário e pelo schema server-side, pra não arriscar
// os dois divergirem silenciosamente com o tempo.
const TITLE_MAX_LENGTH = 60;
const TITLE_TOO_LONG_MESSAGE = `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres`;
const DESCRIPTION_MAX_LENGTH = 280;
const DESCRIPTION_TOO_LONG_MESSAGE = `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres`;
const STEP_TITLE_MAX_LENGTH = 120;
const STEP_TITLE_TOO_LONG_MESSAGE = `O título deve ter no máximo ${STEP_TITLE_MAX_LENGTH} caracteres`;

export const validationSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
  description: z.string().max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG_MESSAGE),
  deadline: z.string().optional(),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  // "" no formulário = não compartilhado.
  sharedWithUserId: z.string().optional(),
});

// Revalidação no servidor (Server Action) do mesmo formato acima — o
// formulário já valida no cliente, mas a Server Action é um endpoint
// público e não pode confiar só nisso.
export const createGoalSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
  description: z.string().max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG_MESSAGE),
  deadline: z.string().optional().nullable(),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  sharedWithUserId: z.string().optional().nullable(),
});

export const updateGoalSchema = createGoalSchema.extend({
  id: z.string().min(1),
});

export const createGoalStepSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().min(1, "Campo obrigatório").max(STEP_TITLE_MAX_LENGTH, STEP_TITLE_TOO_LONG_MESSAGE),
});

export const updateGoalStepSchema = z.object({
  id: z.string().min(1),
  completed: z.boolean(),
});
