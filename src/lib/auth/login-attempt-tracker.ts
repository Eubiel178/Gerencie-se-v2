import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { loginAttempts, users } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { renderLoginAlertEmail } from "./login-alert-email";
import {
  recordFailedAttempt,
  resetLoginAttemptState,
  type LoginAttemptState,
} from "./login-attempt-guard";

async function loadState(userId: string): Promise<LoginAttemptState | null> {
  const [row] = await db.select().from(loginAttempts).where(eq(loginAttempts.userId, userId)).limit(1);
  if (!row) return null;

  return {
    failedCount: row.failedCount,
    windowStartedAt: row.windowStartedAt,
    lastAlertSentAt: row.lastAlertSentAt,
  };
}

async function saveState(userId: string, state: LoginAttemptState): Promise<void> {
  await db
    .insert(loginAttempts)
    .values({ userId, ...state })
    .onConflictDoUpdate({ target: loginAttempts.userId, set: state });
}

/**
 * Chamado pelo `authorize()` do Credentials provider (ver `src/lib/auth.ts`)
 * quando a senha não confere para um usuário que EXISTE (nunca para
 * e-mail desconhecido — não há conta de verdade pra avisar, e evita
 * qualquer diferença de comportamento que ajudasse a descobrir quais
 * e-mails têm cadastro). Nunca lança: uma falha aqui (banco fora do ar,
 * e-mail não configurado) não pode impedir a mensagem de erro normal de
 * login de aparecer.
 */
export async function handleFailedLoginAttempt(userId: string): Promise<void> {
  try {
    const previous = await loadState(userId);
    const { nextState, shouldSendAlert } = recordFailedAttempt(previous, new Date());

    await saveState(userId, nextState);

    if (!shouldSendAlert) return;

    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.email) return;

    // Não espera o SMTP — isso roda dentro do fluxo de login (tentativa
    // errada), travar aqui deixaria a tela de "senha incorreta" parada
    // à toa esperando um e-mail que o usuário nem vê na hora.
    sendEmail({
      to: user.email,
      subject: "Tentativas de login na sua conta — Gerencie-se",
      html: renderLoginAlertEmail({ name: user.name }),
    }).then((result) => {
      if (result.error) console.error("[login-attempt-tracker] falha ao enviar alerta:", result.error);
    });
  } catch (error) {
    console.error("[login-attempt-tracker] falha ao processar tentativa malsucedida", error);
  }
}

/** Chamado quando o login com senha dá certo — limpa qualquer sequência
 * de tentativas erradas em andamento. Mesma tolerância a falha do
 * método acima: nunca impede o login de completar. */
export async function handleSuccessfulLogin(userId: string): Promise<void> {
  try {
    await saveState(userId, resetLoginAttemptState());
  } catch (error) {
    console.error("[login-attempt-tracker] falha ao limpar tentativas após login", error);
  }
}
