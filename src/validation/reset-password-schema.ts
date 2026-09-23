import { z } from "zod";

// Mesmo limite mínimo do cadastro (`register-schema.ts`) e da troca de
// senha logada (`change-password-schema.ts`).
const NEW_PASSWORD_MIN_LENGTH = 6;

export const validationSchema = z
  .object({
    password: z.string().min(NEW_PASSWORD_MIN_LENGTH, "A senha deve ter pelo menos 6 caracteres"),
    confirm_password: z.string().min(1, "Campo obrigatório"),
  })
  .refine(({ password, confirm_password }) => password === confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });
