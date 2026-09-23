import assert from "node:assert/strict";
import test from "node:test";

import { buildRecentHistory } from "./build-recent-history";
import type { ChatMessage } from "./use-chat-history";

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, "role" | "text">): ChatMessage {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    taskId: null,
    ...partial,
  };
}

test("mensagens ai entram no histórico normalmente", () => {
  const messages = [
    msg({ role: "user", text: "oi" }),
    msg({ role: "mascot", text: "e aí", kind: "ai" }),
  ];
  const result = buildRecentHistory(messages);
  assert.deepEqual(result, [
    { role: "user", text: "oi" },
    { role: "mascot", text: "e aí" },
  ]);
});

test("mensagens de fallback NUNCA voltam como histórico pro modelo", () => {
  const messages = [
    msg({ role: "user", text: "oi" }),
    msg({ role: "mascot", text: "Tô sem IA agora, mas posso te ajudar com o básico.", kind: "fallback" }),
    msg({ role: "user", text: "beleza" }),
  ];
  const result = buildRecentHistory(messages);
  assert.deepEqual(result, [
    { role: "user", text: "oi" },
    { role: "user", text: "beleza" },
  ]);
});

test("mensagens de erro técnico NUNCA voltam como histórico pro modelo", () => {
  const messages = [
    msg({ role: "user", text: "oi" }),
    msg({ role: "mascot", text: "Algo deu errado. Tenta de novo.", kind: "error" }),
  ];
  const result = buildRecentHistory(messages);
  assert.deepEqual(result, [{ role: "user", text: "oi" }]);
});

test("mensagens antigas sem `kind` (pré-migração) continuam entrando - não dá pra saber a origem retroativamente", () => {
  const messages = [msg({ role: "mascot", text: "resposta antiga" })];
  const result = buildRecentHistory(messages);
  assert.deepEqual(result, [{ role: "mascot", text: "resposta antiga" }]);
});

test("continuidade conversacional SOBREVIVE à troca de tarefa ativa (achado real: filtro por taskId apagava papo casual inteiro quando a tarefa mudava)", () => {
  const messages = [
    msg({ role: "user", text: "kkkk seu bicho é doido", taskId: "task-a", kind: "ai" }),
    msg({ role: "mascot", text: "kkk pois é", taskId: "task-a", kind: "ai" }),
    // Tarefa A terminou/foi abandonada - taskId da sessão ativa agora é null.
    msg({ role: "user", text: "seu cu", taskId: null, kind: "ai" }),
  ];
  const result = buildRecentHistory(messages);
  assert.deepEqual(result, [
    { role: "user", text: "kkkk seu bicho é doido" },
    { role: "mascot", text: "kkk pois é" },
    { role: "user", text: "seu cu" },
  ]);
});

test("limita às últimas 10 mensagens elegíveis, preservando a ordem", () => {
  const messages = Array.from({ length: 15 }, (_, i) => msg({ role: "user", text: `msg ${i}`, kind: "ai" }));
  const result = buildRecentHistory(messages);
  assert.equal(result.length, 10);
  assert.equal(result[0].text, "msg 5");
  assert.equal(result[9].text, "msg 14");
});
