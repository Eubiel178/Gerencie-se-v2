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
