import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Criptografia simétrica (AES-256-GCM) para dados sensíveis que precisam
 * ser lidos de volta em texto puro — ao contrário de senha, que só
 * precisa ser comparada (ver `bcrypt` em `src/lib/auth.ts`). Usado hoje só
 * para os tokens OAuth do Google Calendar (`accessToken`/`refreshToken` em
 * `google_connection`, ver `src/lib/google-calendar.ts`): hospedado
 * publicamente, um dump do banco não deve expor acesso à agenda de
 * ninguém.
 *
 * A chave vem de `TOKEN_ENCRYPTION_KEY` (32 bytes em base64 — gere com
 * `openssl rand -base64 32`, mesmo padrão do `AUTH_SECRET`). Trocar essa
 * chave invalida todas as conexões existentes (o usuário precisa
 * reconectar o Google Agenda) — nunca gere uma nova em produção sem
 * necessidade real.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

function getKey(): Buffer {
  const encoded = process.env.TOKEN_ENCRYPTION_KEY;

  if (!encoded) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY não configurada — necessária para conectar o Google Agenda. Gere uma com `openssl rand -base64 32` (ver docs/DEPLOY.md)."
    );
  }

  const key = Buffer.from(encoded, "base64");

  if (key.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY inválida — precisa decodificar para exatamente 32 bytes (gere com `openssl rand -base64 32`)."
    );
  }

  return key;
}

/** Criptografa um texto (ex.: token OAuth) para guardar no banco. Saída:
 * uma única string base64 (iv + authTag + ciphertext concatenados) — cada
 * chamada usa um iv novo, então criptografar o mesmo texto duas vezes
 * produz saídas diferentes (nunca compare ciphertexts diretamente). */
export function encryptToken(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Reverte `encryptToken`. Lança erro claro se a chave mudou ou o valor
 * foi corrompido — o GCM autentica o conteúdo, não só cifra. */
export function decryptToken(cipherText: string): string {
  const key = getKey();
  const raw = Buffer.from(cipherText, "base64");

  const iv = raw.subarray(0, IV_LENGTH_BYTES);
  const authTag = raw.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
  const ciphertext = raw.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
