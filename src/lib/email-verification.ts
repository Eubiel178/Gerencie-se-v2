import "server-only";

import { randomInt } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { emailVerificationCodes, users } from "@/db/schema";

// 15 minutos — curto o bastante pra não sobreviver muito além de quando a
// pessoa efetivamente abre o e-mail (janela normal de "acabei de me
// cadastrar"), longo o bastante pra não expirar por causa de um e-mail um
// pouco mais lento pra chegar. Pedir um código novo (reenviar) é sempre
// uma opção disponível, então não há motivo pra uma janela mais longa.
const CODE_TTL_MINUTES = 15;

// 6 dígitos = 1.000.000 de combinações. Sozinho isso seria fraco contra
// força bruta rápida o bastante — é o limite de tentativas abaixo que
// realmente protege (mesmo raciocínio de um PIN bancário: poucas
// combinações, mas poucas tentativas também).
const MAX_VERIFICATION_ATTEMPTS = 8;

export type VerifyEmailCodeResult =
  | { ok: true }
  | { ok: false; reason: "no-pending-code" | "expired" | "too-many-attempts" | "wrong-code" };

function generateCode(): string {
  // `randomInt` (não `Math.random`) — precisa ser imprevisível o
  // bastante pra não virar um atalho de força bruta mais fácil que
  // simplesmente tentar as 1.000.000 combinações na cara.
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Gera (e persiste) um código novo de verificação para `userId`, sempre
 * substituindo qualquer código anterior (reenviar zera as tentativas
 * também — evita que uma pessoa fique presa num contador de tentativas
 * de um código antigo que ela já não tem mais como usar).
 */
export async function createEmailVerificationCode(userId: string): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  await db
    .insert(emailVerificationCodes)
    .values({ userId, code, expiresAt, attempts: 0 })
    .onConflictDoUpdate({
      target: emailVerificationCodes.userId,
      set: { code, expiresAt, attempts: 0 },
    });

  return code;
}

/**
 * Confirma (ou não) o código digitado. Em caso de sucesso, marca
 * `users.emailVerified` e apaga o código (uso único). Em caso de código
 * errado, incrementa `attempts` e devolve o motivo — o chamador decide
 * a mensagem exibida (nunca revela, por exemplo, se o código só estava
 * expirado vs. errado, pra não dar pista extra a uma tentativa de força
 * bruta; a mensagem final ao usuário é sempre genérica o bastante).
 */
export async function verifyEmailVerificationCode(
  userId: string,
  submittedCode: string
): Promise<VerifyEmailCodeResult> {
  const [row] = await db
    .select()
    .from(emailVerificationCodes)
    .where(eq(emailVerificationCodes.userId, userId))
    .limit(1);

  if (!row) return { ok: false, reason: "no-pending-code" };

  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.userId, userId));
    return { ok: false, reason: "expired" };
  }

  if (row.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    return { ok: false, reason: "too-many-attempts" };
  }

  if (row.code !== submittedCode) {
    await db
      .update(emailVerificationCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailVerificationCodes.userId, userId));

    return { ok: false, reason: "wrong-code" };
  }

  await db.transaction(async (tx) => {
    await tx.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
    await tx.delete(emailVerificationCodes).where(eq(emailVerificationCodes.userId, userId));
  });

  return { ok: true };
}

/** Usado pelo gate em `src/app/home/layout.tsx` — nunca confia num valor
 * vindo do cliente, sempre relê do banco pela sessão atual. */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return !!row?.emailVerified;
}
