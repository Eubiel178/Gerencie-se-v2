import "server-only";

import { randomBytes } from "node:crypto";

import { eq, lt } from "drizzle-orm";

import { db } from "@/db/client";
import { passwordResetTokens } from "@/db/schema";

// 1h é o padrão de mercado pra link de redefinição de senha (curto o
// bastante pra limitar a janela de um e-mail vazado/interceptado, longo
// o bastante pra não expirar antes do usuário sair do próprio e-mail).
const TOKEN_TTL_MINUTES = 60;

/**
 * Cria (e persiste) um token de recuperação de senha para `userId`.
 * `randomBytes(32)` = 256 bits de entropia — imprevisível o bastante pra
 * servir como chave primária (ver comentário da tabela em
 * `src/db/schema.ts`).
 *
 * Também limpa qualquer token expirado de qualquer usuário — não existe
 * uma rotina de limpeza separada (cron) só pra isso, então aproveitamos
 * esta chamada, que já acontece toda vez que alguém pede redefinição.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date()));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

  await db.insert(passwordResetTokens).values({ token, userId, expiresAt });

  return token;
}

/**
 * Valida um token e, se válido, consome-o (apaga a linha) e retorna o
 * `userId` associado. Retorna `null` para token inexistente ou expirado
 * — de propósito, o chamador não distingue os dois casos (mesma mensagem
 * genérica pro usuário, sem revelar qual foi o motivo).
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: passwordResetTokens.userId, expiresAt: passwordResetTokens.expiresAt })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!row) return null;

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  if (row.expiresAt.getTime() < Date.now()) return null;

  return row.userId;
}
