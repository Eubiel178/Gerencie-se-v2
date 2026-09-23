import type { ChatMessage } from "./use-chat-history";

/**
 * Acha a tarefa que a conversa está de fato focada agora - a última
 * mensagem (de qualquer um dos dois lados) que carrega um `taskId`
 * real. Cada `ChatMessage` já guarda essa marcação (ver `ChatMessage.
 * taskId`), então isto reaproveita um dado que já existe, sem precisar
 * de um store novo/persistência separada: o "foco" da conversa nada
 * mais é do que "de qual tarefa a última mensagem relevante falava".
 *
 * Isto é o que faz um clique em "Me ajuda" numa tarefa específica
 * continuar valendo pras respostas SEGUINTES ("divide em passos",
 * "reescreve"...), não só pra própria mensagem que o botão gerou -
 * achado real: antes disso, cada mensagem nova recalculava o contexto
 * do zero a partir da sessão de execução ATIVA, perdendo de vista
 * qualquer tarefa que não fosse essa.
 */
export function resolveConversationTaskId(messages: readonly ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].taskId !== null) return messages[i].taskId;
  }
  return null;
}
