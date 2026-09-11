import { z } from "zod";

export const validationSchema = z.object({
  name: z
    .string()
    .min(1, "Campo obrigatório")
    .max(60, "O nome deve ter no máximo 60 caracteres"),
});
