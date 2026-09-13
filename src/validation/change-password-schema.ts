import { z } from "zod";

// Mesmo limite mínimo do cadastro (`register-schema.ts`) — nunca faz
// sentido exigir menos aqui do que na criação da conta.
const NEW_PASSWORD_MIN_LENGTH = 6;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(NEW_PASSWORD_MIN_LENGTH, "A nova senha deve ter pelo menos 6 caracteres"),
    confirmNewPassword: z.string().min(1, "Campo obrigatório"),
  })
  .refine(({ newPassword, confirmNewPassword }) => newPassword === confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  });
