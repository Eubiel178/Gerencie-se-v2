import { z } from "zod";

export const validationSchema = z.object({
  tag: z
    .string()
    .refine(
      (value) => ["studie", "work", "exercise", "other"].includes(value),
      {
        message: "Selecione uma tag",
      }
    ),
  title: z
    .string()
    .min(1, "Campo obrigatório")
    .max(30, "O título deve ter no máximo 30 caracteres"),
  description: z
    .string()
    .min(1, "Campo obrigatório")
    .max(165, "A descricão deve ter no máximo 165 caracteres"),
});
