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
});
