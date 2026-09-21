import "server-only";

import { generateText, sanitizeUserContent } from "./gateway";
import { COMPANION_SYSTEM_PROMPT } from "./prompts/system-prompt";
import type { HistoryMessage } from "./providers/types";

/**
 * Chat direto com o Companion — SOMENTE sob demanda.
 * Retorna null quando todos os providers indisponíveis
 * para que o chamador use fallback context-aware.
 *
 * Usa COMPANION_SYSTEM_PROMPT como base — mesmas regras globais
 * compartilhadas com todas as operações estruturadas.
 */
export async function askGemini(
  message: string,
  systemInstruction?: string,
  history?: HistoryMessage[],
): Promise<{ text: string; model: string } | null> {
  return generateText({
    prompt: sanitizeUserContent(message),
    systemInstruction: systemInstruction ?? COMPANION_SYSTEM_PROMPT,
    operation: "chat",
    history,
  });
}
