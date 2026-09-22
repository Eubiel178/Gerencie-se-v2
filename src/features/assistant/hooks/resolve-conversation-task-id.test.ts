import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveConversationTaskId } from "./resolve-conversation-task-id";
import type { ChatMessage } from "./use-chat-history";

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "user",
    text: "oi",
    timestamp: Date.now(),
    taskId: null,
    ...overrides,
  };
}

test("histórico vazio não tem foco nenhum", () => {
  assert.equal(resolveConversationTaskId([]), null);
});

test("nenhuma mensagem com taskId - sem foco", () => {
  const messages = [makeMessage(), makeMessage()];
  assert.equal(resolveConversationTaskId(messages), null);
});

test("bug real corrigido: 'Me ajuda' marca uma mensagem com taskId - foco continua nessa tarefa mesmo em mensagens SEGUINTES sem taskId próprio", () => {
  const messages = [
    makeMessage({ text: 'Pode me ajudar com "Correr contra o tempo"?', taskId: "task-1" }),
    makeMessage({ role: "mascot", text: "Claro, o que você quer fazer primeiro?", taskId: null }),
    makeMessage({ text: "divide em passos", taskId: null }),
  ];
  assert.equal(resolveConversationTaskId(messages), "task-1");
});

test("uma mensagem MAIS RECENTE com taskId diferente muda o foco", () => {
  const messages = [
    makeMessage({ taskId: "task-1" }),
    makeMessage({ taskId: "task-2" }),
  ];
  assert.equal(resolveConversationTaskId(messages), "task-2");
});
