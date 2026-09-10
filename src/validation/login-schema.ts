import { z } from "zod";

export const validationSchema = z.object({
  email: z
    .string()
    .min(1, "Campo obrigatório")
    .email({ message: "Informe um email válido" }),
  password: z.string().min(1, "Campo obrigatório"),
  remember_me: z.boolean(),
});
