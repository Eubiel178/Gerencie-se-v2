import type { ChatMessage } from "./use-chat-history";

const HISTORY_LIMIT = 10;

/**
 * Monta o histórico que vai pro modelo numa nova chamada de chat -
 * extraído de `Widget.sendToAssistant` pra ser testável isoladamente
 * (mesmo raciocínio de `companion-fallback.ts`/`split-conversation-beats.ts`).
 *
 * Duas regras, as duas fontes reais de bugs encontrados:
 * 1. Só entra o que foi trocado sobre a MESMA tarefa ativa agora - senão
 *    o modelo recebe, no mesmo prompt, tanto o contexto factual correto
 *    quanto trechos de conversa sobre uma tarefa diferente.
 * 2. Nunca manda de volta um fallback local ou um erro técnico como se
 *    fosse uma fala real do Companion (`kind !== "ai"`) - um desses virando
 *    "histórico" contaminava o tom das respostas seguintes, mesmo depois
 *    do provider voltar a funcionar. Mensagens antigas sem `kind`
 *    (gravadas antes desse campo existir) continuam entrando - não tem
 *    como saber a origem delas retroativamente.
 */
export function buildRecentHistory(
  messages: readonly ChatMessage[],
  taskId: string | null
): Array<{ role: "user" | "mascot"; text: string }> {
  return messages
    .filter((m) => m.taskId === taskId && m.kind !== "fallback" && m.kind !== "error")
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, text: m.text }));
}
