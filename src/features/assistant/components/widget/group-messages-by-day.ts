import { formatDayLabel } from "@/utils/date";

import type { ChatMessage } from "../../hooks/use-chat-history";

export interface ChatMessageGroup {
  dayLabel: string;
  /** Mantém o índice original em `messages` — usado pra achar a mensagem
   *  do usuário que gerou um erro (ver `Widget`), sem precisar recalcular
   *  posição depois de agrupar. */
  entries: Array<{ message: ChatMessage; index: number }>;
}

/**
 * Agrupa mensagens (já em ordem cronológica — sempre são, `useChatHistory`
 * só faz `push`) em blocos por dia (`formatDayLabel`: "Hoje"/"Ontem"/data).
 * Como `formatDayLabel` calcula "hoje" no momento da chamada, uma
 * conversa que atravessa a meia-noite forma grupos corretos sozinha —
 * sem precisar de um relógio rodando no componente.
 */
export function groupMessagesByDay(messages: readonly ChatMessage[]): ChatMessageGroup[] {
  const groups: ChatMessageGroup[] = [];

  messages.forEach((message, index) => {
    const dayLabel = formatDayLabel(new Date(message.timestamp)) ?? "";
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.dayLabel === dayLabel) {
      lastGroup.entries.push({ message, index });
    } else {
      groups.push({ dayLabel, entries: [{ message, index }] });
    }
  });

  return groups;
}
