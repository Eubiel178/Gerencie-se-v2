"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "mascot";
  text: string;
  timestamp: number;
  /** Tarefa em execução no momento em que a mensagem foi enviada (ou
   *  `null` se nenhuma) — usado pra nunca mandar pro modelo, como
   *  histórico, uma troca de mensagens que era sobre outra tarefa. Ver
   *  `Widget.handleSendChat`. */
  taskId: string | null;
  /** De onde essa mensagem do MASCOTE veio de verdade - `undefined`/`role
   *  "user"` não se aplica. "ai" = geração real do provider, a única que
   *  volta a entrar como histórico numa chamada futura. "fallback" = texto
   *  fixo local (`buildContextualFallback`, providers indisponíveis) e
   *  "error" = falha de rede/timeout do lado do cliente - nenhum dos dois
   *  é uma fala real do Companion, então NUNCA deveriam ser mandados de
   *  volta pro modelo como se fossem um turno anterior dele (achado real:
   *  antes disso existir, um erro técnico ou um fallback genérico virava
   *  "histórico" e contaminava o tom das respostas seguintes - ver
   *  `Widget.sendToAssistant`). Mensagens antigas gravadas antes deste
   *  campo existir vêm como `undefined` - tratadas como "ai" por
   *  compatibilidade (não dá pra saber a origem retroativamente). */
  kind?: "ai" | "fallback" | "error";
}

const STORAGE_KEY = "assistant-chat-history";
const MAX_MESSAGES = 50;
const EMPTY_MESSAGES: readonly ChatMessage[] = [];

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]): void {
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable
  }
}

// Shared store — module-level, loaded once per client session
let memory: ChatMessage[] = [];
let loaded = false;
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    memory = loadHistory();
  }
}

function subscribe(callback: () => void) {
  ensureLoaded();
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): ChatMessage[] {
  ensureLoaded();
  return memory;
}

function getServerSnapshot(): readonly ChatMessage[] {
  return EMPTY_MESSAGES;
}

function subscribeHydrationNoop() {
  return () => {};
}

function getHydratedClientSnapshot(): boolean {
  return true;
}

function getHydratedServerSnapshot(): boolean {
  return false;
}

export function useChatHistory() {
  const messages = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Mesmo truque de `useSyncExternalStore` acima, não um `useEffect` +
  // `useState` — no SSR e na primeira passada de hidratação do client, o
  // React usa `getServerSnapshot` (false) pra bater com o HTML do
  // servidor; só depois de hidratado ele troca pra `getSnapshot` (true).
  // Isso evita o mismatch de hidratação (o Widget usa esse valor pra
  // decidir se abre o bubble) sem o setState síncrono dentro de efeito.
  const hydrated = useSyncExternalStore(
    subscribeHydrationNoop,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot
  );

  const addUserMessage = useCallback((text: string, taskId: string | null) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: Date.now(),
      taskId,
    };
    memory = [...memory, msg];
    saveHistory(memory);
    emitChange();
  }, []);

  const addMascotMessage = useCallback((text: string, taskId: string | null, kind: ChatMessage["kind"] = "ai") => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "mascot",
      text,
      timestamp: Date.now(),
      taskId,
      kind,
    };
    memory = [...memory, msg];
    saveHistory(memory);
    emitChange();
  }, []);

  const clearHistory = useCallback(() => {
    memory = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ok
    }
    emitChange();
  }, []);

  return {
    messages,
    addUserMessage,
    addMascotMessage,
    clearHistory,
    hydrated,
  };
}
