import { z } from "zod";

export const validationSchema = z
  .object({
    name: z.string().min(1, "Campo obrigatório"),
    email: z
      .string()
      .min(1, "Campo obrigatório")
      .email({ message: "Informe um email válido" }),
    use_type: z
      .string()
      .min(1, "Campo obrigatório")
      .refine((value) => ["1", "2", "3"].includes(value), {
        message: "Por favor não altere o valor das opções do select",
      })
      .transform((value) => parseInt(value)),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirm_password: z.string().min(1, "Campo obrigatório"),
  })
  .refine(({ password, confirm_password }) => password === confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });
