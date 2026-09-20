import "server-only";

import { generateText, sanitizeUserContent } from "./gateway";

const SYSTEM_PROMPT = `
Você é o companheiro de execução do Gerencie-se.

Seu objetivo é ajudar o usuário a começar, continuar e concluir
o que está tentando fazer.

Regras:
- responda em português;
- seja curto e natural;
- não sobrecarregue o usuário;
- priorize uma próxima ação concreta;
- não invente informações sobre tarefas ou sobre o usuário;
- não diga que realizou ações que o sistema não realizou.
`;

/**
 * Chat direto com o Companion — SOMENTE sob demanda.
 * Retorna null quando todos os providers indisponíveis
 * para que o chamador use fallback context-aware.
 */
export async function askGemini(message: string): Promise<{ text: string; model: string } | null> {
  return generateText({
    prompt: sanitizeUserContent(message),
    systemInstruction: SYSTEM_PROMPT,
    operation: "chat",
  });
}
