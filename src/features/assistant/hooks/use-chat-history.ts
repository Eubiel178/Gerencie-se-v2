"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "mascot";
  text: string;
  timestamp: number;
}

const STORAGE_KEY = "assistant-chat-history";
const MAX_MESSAGES = 50;

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

function getServerSnapshot(): ChatMessage[] {
  return [];
}

export function useChatHistory() {
  const messages = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addUserMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: Date.now(),
    };
    memory = [...memory, msg];
    saveHistory(memory);
    emitChange();
  }, []);

  const addMascotMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "mascot",
      text,
      timestamp: Date.now(),
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
    hydrated: typeof window !== "undefined",
  };
}
