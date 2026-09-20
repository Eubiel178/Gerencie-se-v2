import "server-only";

import type { ErrorCategory } from "../config";

/**
 * Classifica erros de providers de IA em categorias internas.
 * Evita que erros específicos de SDKs (Groq, Gemini) vazem para o resto da aplicação.
 */
export function classifyError(error: unknown): ErrorCategory {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate") || msg.includes("quota") || msg.includes("resource_exhausted")) {
      return "rate_limit";
    }
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return "timeout";
    }
    if (/5[0-9]{2}/.test(error.message)) {
      return "server_error";
    }
    if (msg.includes("401") || msg.includes("403") || msg.includes("auth") || msg.includes("invalid") || msg.includes("api_key")) {
      return "auth_error";
    }
  }
  return "unknown";
}
