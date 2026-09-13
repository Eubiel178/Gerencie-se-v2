"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/password-reset";
import {
  renderPasswordResetEmail,
  renderGoogleOnlyAccountEmail,
} from "@/lib/password-reset-email";
import { validationSchema as loginSchema } from "@/validation/login-schema";
import { validationSchema as registerSchema } from "@/validation/register-schema";
import { validationSchema as forgotPasswordSchema } from "@/validation/forgot-password-schema";
import { validationSchema as resetPasswordSchema } from "@/validation/reset-password-schema";

import type { ActionResult } from "@/types/action-result";

export type AuthActionState = {
  error: string | null;
};

const GENERIC_LOGIN_ERROR = "E-mail ou senha inválidos.";

// Mesmo custo de hash usado em toda troca/criação de senha do app (ver
// `src/features/profile/actions.ts`) — nunca deve divergir entre os
// lugares que geram um hash novo.
const BCRYPT_SALT_ROUNDS = 12;

export async function loginAction(
  data: unknown
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  try {
    // `redirect: false` faz o `signIn` nunca redirecionar sozinho — nem em
    // caso de sucesso, nem de falha. Assim o catch abaixo só recebe erro de
    // credencial de verdade (nunca o redirect interno de sucesso disfarçado
    // de erro), e o redirect pro /home é sempre o nosso, explícito, depois
    // do try/catch.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: GENERIC_LOGIN_ERROR };
    }

    return {
      error: "Não foi possível entrar agora. Tente novamente.",
    };
  }

  redirect("/home");
}

export async function registerAction(
  data: unknown
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Verifique os dados informados." };
  }

  const { name, email, password } = parsed.data;

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return {
      error:
        "Já existe uma conta com este e-mail. Tente entrar, ou use \"Continuar com Google\" se foi assim que você se cadastrou.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({ name, email, passwordHash });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // A conta já foi criada; se o login automático falhar por algum motivo
    // inesperado, mandamos para o login manual em vez de perder o cadastro.
    redirect("/login");
  }

  redirect("/home");
}

export type RequestPasswordResetState = {
  error: string | null;
  sent: boolean;
};

/** Sempre retorna a mesma mensagem de sucesso, exista ou não uma conta
 * com o e-mail informado (ver `GENERIC_RESET_REQUEST_MESSAGE` acima). O
 * envio de verdade (ou não) acontece por trás, sem afetar a resposta. */
export async function requestPasswordResetAction(
  data: unknown
): Promise<RequestPasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Informe um e-mail válido.", sent: false };
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (user) {
    if (user.passwordHash) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${appUrl()}/reset-password?token=${token}`;

      await sendEmail({
        to: parsed.data.email,
        subject: "Redefinir sua senha — Gerencie-se",
        html: renderPasswordResetEmail({ name: user.name, resetUrl }),
      });
    } else {
      // Conta existe, mas foi criada via Google — não há senha pra
      // redefinir. Avisamos só quem tem acesso à caixa de entrada (não é
      // uma resposta visível pra quem só está tentando descobrir contas).
      await sendEmail({
        to: parsed.data.email,
        subject: "Redefinir sua senha — Gerencie-se",
        html: renderGoogleOnlyAccountEmail({ name: user.name }),
      });
    }
  }

  return { error: null, sent: true };
}

export async function resetPasswordAction(
  token: string,
  data: unknown
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await consumePasswordResetToken(token);

  if (!userId) {
    return { error: "Link inválido ou expirado. Peça uma nova redefinição." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_SALT_ROUNDS);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  return { error: null };
}
