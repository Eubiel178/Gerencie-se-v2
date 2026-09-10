import { z } from "zod";

export const validationSchema = z
  .object({
    title: z
      .string()
      .min(1, "Campo obrigatório")
      .max(60, "O título deve ter no máximo 60 caracteres"),
    frequency: z.enum(["daily", "weekly"]),
    // String no formulário (input number vem como string) — convertido e
    // validado só quando frequency = "weekly".
    targetPerWeek: z.string().optional(),
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
      message: "Informe quantas vezes por semana (de 1 a 7)",
      path: ["targetPerWeek"],
    }
  );

// Revalidação no servidor da Server Action — mesmas regras acima, mas já
// sobre o formato tipado (targetPerWeek como number, não string de form).
const habitParamsBase = z
  .object({
    title: z.string().min(1, "Campo obrigatório").max(60, "Título muito longo"),
    frequency: z.enum(["daily", "weekly"]),
    targetPerWeek: z.number().int().min(1).max(7).optional().nullable(),
    goalId: z.string().optional().nullable(),
  })
  .refine((data) => data.frequency !== "weekly" || !!data.targetPerWeek, {
    message: "Informe quantas vezes por semana (de 1 a 7)",
    path: ["targetPerWeek"],
  });

export const createHabitSchema = habitParamsBase;

export const toggleHabitLogSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

export const updateHabitSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1, "Campo obrigatório").max(60, "Título muito longo"),
    frequency: z.enum(["daily", "weekly"]),
    targetPerWeek: z.number().int().min(1).max(7).optional().nullable(),
    goalId: z.string().optional().nullable(),
  })
  .refine((data) => data.frequency !== "weekly" || !!data.targetPerWeek, {
    message: "Informe quantas vezes por semana (de 1 a 7)",
    path: ["targetPerWeek"],
  });
