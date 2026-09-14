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

  const { name, password } = parsed.data;
  // Mesma normalização de `local-connection.ts` (convite) - sem isso,
  // cadastrar com "User@X.com" e depois tentar entrar/recuperar senha
  // com "user@x.com" (ou vice-versa) falha silenciosamente pra uma
  // conta que existe de verdade (achado da auditoria pré-deploy).
  const email = parsed.data.email.trim().toLowerCase();

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

  try {
    await db.insert(users).values({ name, email, passwordHash });
  } catch {
    return {
      error: "Não foi possível criar sua conta agora. Tente novamente.",
    };
  }

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

/** Decisão do usuário (confirmada explicitamente após alerta de trade-off
 * de segurança): quando o e-mail não tem conta, a resposta diz isso na
 * hora em vez da mensagem genérica de "se existir, enviamos". Isso é uma
 * brecha de enumeração de contas por design (permite descobrir quais
 * e-mails estão cadastrados) — aceita conscientemente em troca de um
 * feedback mais direto pro usuário legítimo que errou o e-mail. */
export async function requestPasswordResetAction(
  data: unknown
): Promise<RequestPasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Informe um e-mail válido.", sent: false };
  }

  // Mesma normalização de `registerAction`/login (`auth.ts`) - sem isso,
  // pedir redefinição com um e-mail em maiúsculas diferente do salvo
  // dizia "não existe conta" pra uma conta que existe de verdade
  // (achado da auditoria pré-deploy).
  const email = parsed.data.email.trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { error: "Não existe conta cadastrada com este e-mail.", sent: false };
  }

  // Nunca espera o SMTP terminar antes de responder — o link já foi
  // gerado e salvo, então travar aqui só deixaria a tela parada à toa (o
  // Gmail demora bem mais que uma API de e-mail transacional dedicada,
  // ver `src/lib/email.ts`); se o envio falhar de verdade, só fica
  // registrado no log do servidor.
  if (user.passwordHash) {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = `${appUrl()}/reset-password?token=${token}`;

    sendEmail({
      to: email,
      subject: "Redefinir sua senha — Gerencie-se",
      html: renderPasswordResetEmail({ name: user.name, resetUrl }),
    }).then((result) => {
      if (result.error) console.error("[auth] falha ao enviar e-mail de redefinição de senha:", result.error);
    });
  } else {
    // Conta existe, mas foi criada via Google — não há senha pra
    // redefinir.
    sendEmail({
      to: email,
      subject: "Redefinir sua senha — Gerencie-se",
      html: renderGoogleOnlyAccountEmail({ name: user.name }),
    }).then((result) => {
      if (result.error) console.error("[auth] falha ao enviar e-mail de aviso de conta Google:", result.error);
    });
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
