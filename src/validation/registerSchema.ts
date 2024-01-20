import { z } from "zod";

export const validationSchema = z
  .object({
    name: z.string().min(1, "Campo obrigatório"),
    email: z
      .string()
      .min(1, "Campo obrigatório")
      .email({ message: "Informe um email válido" }),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirm_password: z.string().min(1, "Campo obrigatório"),
  })
  .refine(({ password, confirm_password }) => password === confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });
