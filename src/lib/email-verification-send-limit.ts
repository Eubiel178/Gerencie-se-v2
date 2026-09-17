export const VERIFICATION_RESEND_COOLDOWN_MS = 30_000;

/**
 * Retorna quantos segundos ainda faltam para outro envio, ou `null` quando
 * o envio já pode acontecer. Mantido puro para a regra ser testável sem
 * depender do banco ou do provedor de e-mail.
 */
export function getVerificationResendRetryAfterSeconds(
  lastSentAt: Date | null,
  now = Date.now()
): number | null {
  if (!lastSentAt) return null;

  const remainingMs = lastSentAt.getTime() + VERIFICATION_RESEND_COOLDOWN_MS - now;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1_000) : null;
}
