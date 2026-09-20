import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Compara em tempo constante para não vazar o `CRON_SECRET` por
 * temporização (cada byte igual antecipadamente sairia mais rápido numa
 * comparação `!==` comum). Usado por toda rota `/api/cron/*` chamada por
 * um agendador externo (cron-job.org, GitHub Actions etc.).
 */
export function isValidCronSecret(authHeader: string, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authHeader);

  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}
