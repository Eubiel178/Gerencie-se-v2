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
import { requireUserId } from "@/lib/require-user-id";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/password-reset";
import {
  renderPasswordResetEmail,
  renderGoogleOnlyAccountEmail,
} from "@/lib/password-reset-email";
import {
  createEmailVerificationCode,
  getEmailVerificationSendAvailability,
  restorePreviousEmailVerificationCode,
  verifyEmailVerificationCode,
} from "@/lib/email-verification";
import { renderVerificationCodeEmail } from "@/lib/email-verification-email";
import { validationSchema as loginSchema } from "@/validation/login-schema";
import { validationSchema as registerSchema } from "@/validation/register-schema";
import { validationSchema as forgotPasswordSchema } from "@/validation/forgot-password-schema";
import { validationSchema as resetPasswordSchema } from "@/validation/reset-password-schema";
import { validationSchema as verifyEmailSchema } from "@/validation/verify-email-schema";
import { normalizeEmail } from "@/utils/normalize-email";

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
  const email = normalizeEmail(parsed.data.email);

  const [existingUser] = await db
    .select({
      id: users.id,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    // Um registro pendente não é uma conta ativa: enquanto o e-mail não
    // estiver confirmado, a própria pessoa pode reiniciar o cadastro com
    // outra senha. Não cria uma segunda linha; substitui só os dados que
    // ainda não foram ativados. O código novo vai para o mesmo e-mail, que
    // continua sendo a única prova para ativar a conta.
    if (!existingUser.emailVerified) {
      const availability = await getEmailVerificationSendAvailability(existingUser.id);
      if (!availability.available) {
        return {
          error: `Aguarde ${availability.retryAfterSeconds}s para reiniciar o cadastro e receber um novo código.`,
        };
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      await db
        .update(users)
        .set({ name, passwordHash })
        .where(eq(users.id, existingUser.id));

      const delivery = await sendVerificationCodeEmail(existingUser.id, email);
      const deliveryFailed = delivery.status === "failed";

      try {
        await signIn("credentials", { email, password, redirect: false });
      } catch {
        return { error: "Não foi possível reiniciar seu cadastro agora. Tente novamente." };
      }

      redirect(
        deliveryFailed
          ? "/verify-email?delivery=failed&resumed=1"
          : "/verify-email?resumed=1"
      );
    }

    return {
      error:
        "Já existe uma conta ativa com este e-mail. Entre ou recupere sua senha para acessar.",
    };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  let userId: string;

  try {
    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id });
    userId = created.id;
  } catch {
    return {
      error: "Não foi possível criar sua conta agora. Tente novamente.",
    };
  }

  // O cadastro continua existindo mesmo se o provedor de e-mail falhar,
  // mas não dizemos falsamente que um código foi enviado. A tela de
  // verificação recebe esse estado e oferece o reenvio de forma explícita.
  const verificationEmailDeliveryFailed = (await sendVerificationCodeEmail(userId, email)).status === "failed";

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // A conta já foi criada; se o login automático falhar por algum motivo
    // inesperado, mandamos para o login manual em vez de perder o cadastro.
    redirect("/login");
  }

  redirect(verificationEmailDeliveryFailed ? "/verify-email?delivery=failed" : "/home");
}

export type VerifyEmailState = {
  error: string | null;
};

const VERIFY_EMAIL_GENERIC_ERROR = "Código inválido. Verifique e tente novamente.";

export async function verifyEmailAction(data: unknown): Promise<VerifyEmailState> {
  const parsed = verifyEmailSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await requireUserId();
  const result = await verifyEmailVerificationCode(userId, parsed.data.code);

  if (!result.ok) {
    if (result.reason === "too-many-attempts") {
      return { error: "Muitas tentativas erradas. Peça um código novo." };
    }
    // "no-pending-code" (já verificado, ou nunca chegou a gerar um) e
    // "expired" também caem na mesma mensagem genérica de "wrong-code" —
    // sem diferença visível de motivo, pra não dar nenhuma pista extra a
    // quem estiver tentando adivinhar o código de outra pessoa.
    return { error: VERIFY_EMAIL_GENERIC_ERROR };
  }

  redirect("/home");
}

export type ResendVerificationCodeState = {
  error: string | null;
  sent: boolean;
  retryAfterSeconds?: number;
};

export async function resendVerificationCodeAction(): Promise<ResendVerificationCodeState> {
  const userId = await requireUserId();

  const [user] = await db
    .select({ email: users.email, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email || user.emailVerified) {
    return { error: GENERIC_SEND_ERROR, sent: false };
  }

  const delivery = await sendVerificationCodeEmail(userId, user.email);
  if (delivery.status === "rate-limited") {
    return {
      error: `Aguarde ${delivery.retryAfterSeconds}s antes de pedir outro código.`,
      sent: false,
      retryAfterSeconds: delivery.retryAfterSeconds,
    };
  }

  if (delivery.status === "failed") {
    return { error: GENERIC_SEND_ERROR, sent: false };
  }

  return { error: null, sent: true };
}

export type RequestPasswordResetState = {
  error: string | null;
  sent: boolean;
};

// Mensagem genérica de falha de envio: nunca diz se o motivo foi "conta não
// encontrada" ou "SMTP falhou de verdade" — só que algo deu errado agora.
const GENERIC_SEND_ERROR =
  "Não conseguimos concluir o pedido agora. Tente novamente em instantes.";

/** Gera o código antes de enviar e desfaz essa troca se o SMTP falhar.
 * Compartilhado por cadastro, retomada e reenvio para que os três caminhos
 * tenham exatamente a mesma regra de expiração e consistência. */
type VerificationCodeEmailDelivery =
  | { status: "sent" }
  | { status: "failed" }
  | { status: "rate-limited"; retryAfterSeconds: number };

async function sendVerificationCodeEmail(
  userId: string,
  email: string
): Promise<VerificationCodeEmailDelivery> {
  const availability = await getEmailVerificationSendAvailability(userId);
  if (!availability.available) {
    return { status: "rate-limited", retryAfterSeconds: availability.retryAfterSeconds };
  }

  let createdCode: Awaited<ReturnType<typeof createEmailVerificationCode>> | null = null;

  try {
    createdCode = await createEmailVerificationCode(userId);
    const result = await sendEmail({
      to: email,
      subject: "Confirme seu e-mail — Gerencie-se",
      html: renderVerificationCodeEmail({ code: createdCode.code }),
    });

    if (!result.error) return { status: "sent" };

    await restorePreviousEmailVerificationCode(userId, createdCode);
    console.error("[auth] falha ao enviar código de verificação:", result.error);
  } catch (error) {
    if (createdCode) {
      await restorePreviousEmailVerificationCode(userId, createdCode);
    }
    console.error("[auth] falha ao gerar/enviar código de verificação:", error);
  }

  return { status: "failed" };
}

// Sem conta com esse e-mail, não há nada de verdade pra enviar — mas
// responder na hora, enquanto o caminho de conta existente espera um envio
// real por SMTP (ver `email.ts`, mais lento que uma API de e-mail
// transacional dedicada), reabre por timing a mesma enumeração que a
// mensagem genérica abaixo tenta fechar (achado numa revisão de código
// adversarial). Não elimina o canal por completo (SMTP real tem variância
// própria), mas fecha o sinal óbvio "resposta instantânea vs. com espera de
// rede".
const SIMULATED_SEND_DELAY_MS = 800;

/** Decisão revisada (auditoria de 2026-09): a resposta NUNCA revela se o
 * e-mail tem conta cadastrada — nem na mensagem (sempre "enviamos, se
 * existir"), nem no fato de reportar erro só quando a conta existe, nem no
 * tempo de resposta (`SIMULATED_SEND_DELAY_MS` acima). Quando o e-mail não
 * está cadastrado, simula a espera de um envio real e retorna sucesso
 * genérico, sem tentar enviar nada de verdade. Quando existe, esperamos o
 * envio de verdade (ao contrário do fluxo antigo, que nunca aguardava o
 * SMTP) para poder avisar o usuário legítimo se o envio falhar — sem isso,
 * uma falha de SMTP silenciosa deixava a pessoa esperando um e-mail que
 * nunca chegaria. */
export async function requestPasswordResetAction(
  data: unknown
): Promise<RequestPasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Informe um e-mail válido.", sent: false };
  }

  const email = normalizeEmail(parsed.data.email);

  const [user] = await db
    .select({ id: users.id, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_SEND_DELAY_MS));
    return { error: null, sent: true };
  }

  const result = user.passwordHash
    ? await (async () => {
        const token = await createPasswordResetToken(user.id);
        const resetUrl = `${appUrl()}/reset-password?token=${token}`;

        return sendEmail({
          to: email,
          subject: "Redefinir sua senha — Gerencie-se",
          html: renderPasswordResetEmail({ name: user.name, resetUrl }),
        });
      })()
    : // Conta existe, mas foi criada via Google — não há senha pra redefinir.
      await sendEmail({
        to: email,
        subject: "Redefinir sua senha — Gerencie-se",
        html: renderGoogleOnlyAccountEmail({ name: user.name }),
      });

  if (result.error) {
    console.error("[auth] falha ao enviar e-mail de redefinição de senha:", result.error);
    return { error: GENERIC_SEND_ERROR, sent: false };
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
