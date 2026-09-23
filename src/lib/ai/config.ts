import "server-only";

export const COOLDOWN_MS = 60_000;
// Timeout/erro de servidor também entram em cooldown (mais curto que
// rate-limit, já que costuma ser mais transiente) - sem isso, um modelo
// que acabou de estourar o timeout de 30s era tentado DE NOVO do zero na
// PRÓXIMA mensagem do chat, pagando os mesmos ~30s de espera outra vez
// (achado relatado: "a IA tá demorando muito, muito mesmo"). Repetir
// isso a cada mensagem, com o Groq (3 modelos) tentado antes do Gemini,
// podia significar dezenas de segundos de espera toda vez que o
// primeiro modelo estivesse degradado.
export const ERROR_COOLDOWN_MS = 30_000;
export const AI_TIMEOUT_MS = 30_000;

export type ErrorCategory =
  | "rate_limit"
  | "timeout"
  | "server_error"
  | "auth_error"
  | "unknown";
