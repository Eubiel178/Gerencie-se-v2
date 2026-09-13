import { z } from "zod";

// Única fonte de verdade pro limite de título — reaproveitada pelo schema
// do formulário e pelo schema server-side, pra não arriscar os dois
// divergirem silenciosamente com o tempo.
const TITLE_MAX_LENGTH = 60;
const TITLE_TOO_LONG_MESSAGE = `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres`;
const WEEKLY_TARGET_MESSAGE = "Informe quantas vezes por semana (de 1 a 7)";

export const validationSchema = z
  .object({
    title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
    frequency: z.enum(["daily", "weekly"]),
    // String no formulário (input number vem como string) — convertido e
    // validado só quando frequency = "weekly".
    targetPerWeek: z.string().optional(),
    // "" no formulário = nenhum objetivo vinculado.
    goalId: z.string().optional(),
    // "" no formulário = não compartilhado.
    sharedWithUserId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.frequency === "weekly") {
        const value = Number(data.targetPerWeek);
        return Number.isInteger(value) && value >= 1 && value <= 7;
      }

      return true;
    },
    {
      message: WEEKLY_TARGET_MESSAGE,
      path: ["targetPerWeek"],
    }
  );

// Revalidação no servidor da Server Action — mesmas regras acima, mas já
// sobre o formato tipado (targetPerWeek como number, não string de form).
// Compartilhada entre create/update (abaixo) pra não arriscar as duas
// divergirem silenciosamente com o tempo.
const habitFieldsShape = {
  title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
  frequency: z.enum(["daily", "weekly"] as const),
  targetPerWeek: z.number().int().min(1).max(7).optional().nullable(),
  goalId: z.string().optional().nullable(),
  sharedWithUserId: z.string().optional().nullable(),
};

function withWeeklyTargetRefinement<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  return schema.refine((data) => data.frequency !== "weekly" || !!data.targetPerWeek, {
    message: WEEKLY_TARGET_MESSAGE,
    path: ["targetPerWeek"],
  });
}

export const createHabitSchema = withWeeklyTargetRefinement(z.object(habitFieldsShape));

export const toggleHabitLogSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

export const updateHabitSchema = withWeeklyTargetRefinement(
  z.object({ id: z.string().min(1), ...habitFieldsShape })
);
