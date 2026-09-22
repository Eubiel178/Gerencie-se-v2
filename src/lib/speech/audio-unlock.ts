"use client";

/**
 * Navegadores bloqueiam `audio.play()`/`speechSynthesis.speak()` sem um
 * gesto do usuário antes na página (política de autoplay). Em vez de tentar
 * contornar isso (ex.: tocar um áudio silencioso escondido), este módulo só
 * observa se ALGUM gesto já aconteceu na aba atual — os mesmos tipos de
 * evento que `mascot-pet/engine/idle-watcher.ts` já escuta pra detectar
 * atividade — e libera a fala automática só depois disso. Antes do
 * desbloqueio, o balão de fala ainda aparece (texto), só o TTS fica em
 * silêncio - nunca o contrário.
 */
const UNLOCK_EVENTS = ["pointerdown", "keydown"] as const;

let unlocked = false;
const listeners = new Set<() => void>();

function handleGesture() {
  if (unlocked) return;
  unlocked = true;
  for (const eventName of UNLOCK_EVENTS) {
    window.removeEventListener(eventName, handleGesture);
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  for (const eventName of UNLOCK_EVENTS) {
    window.addEventListener(eventName, handleGesture, {
      passive: true,
      once: false,
    });
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

/** Retorna uma função de cancelamento - chamar no cleanup de quem assinou. */
export function subscribeAudioUnlock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
