import type { ChatMessage } from "./use-chat-history";

const HISTORY_LIMIT = 10;

/**
 * Monta o histórico que vai pro modelo numa nova chamada de chat -
 * extraído de `Widget.sendToAssistant` pra ser testável isoladamente
 * (mesmo raciocínio de `companion-fallback.ts`/`split-conversation-beats.ts`).
 *
 * NÃO filtra mais por `taskId` (achado real, revisão arquitetural): um
 * filtro `m.taskId === taskId` parecia certo pra nunca citar fato de
 * outra tarefa, mas na prática apagava TODA a conversa - inclusive papo
 * puramente social, sem nada a ver com a tarefa - assim que a tarefa
 * ativa mudava (terminou, foi abandonada, nenhuma mais ativa). Isso é
 * amnésia mecânica, não variação de modelo. O problema que o filtro
 * tentava evitar (citar fato de uma tarefa errada) já é resolvido em
 * outro lugar: `buildExecutionContext()` sempre injeta o estado REAL e
 * ATUAL num bloco separado, e o prompt já instrui explicitamente que o
 * contexto factual vem do banco, nunca do histórico da conversa.
 * Continuidade conversacional (piada em andamento, referência a "isso",
 * mudança de clima) não precisa desse gate - só as últimas N mensagens,
 * na ordem real.
 *
 * Nunca manda de volta um fallback local ou um erro técnico como se
 * fosse uma fala real do Companion (`kind !== "ai"`) - um desses virando
 * "histórico" contaminava o tom das respostas seguintes, mesmo depois
 * do provider voltar a funcionar. Mensagens antigas sem `kind` (gravadas
 * antes desse campo existir) continuam entrando - não tem como saber a
 * origem delas retroativamente.
 */
export function buildRecentHistory(
  messages: readonly ChatMessage[]
): Array<{ role: "user" | "mascot"; text: string }> {
  return messages
    .filter((m) => m.kind !== "fallback" && m.kind !== "error")
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, text: m.text }));
}
