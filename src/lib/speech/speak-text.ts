"use client";

import { useEffect, useState } from "react";

/** Palavras cuja grafia informal (a que aparece NA TELA, ver
 * `mascot-lines.ts`) não é a que soa mais natural quando lida em voz
 * alta por um sintetizador — ex.: "vei" (gíria, "véi"/"mano") sai sem o
 * acento porque é assim que se escreve no português informal escrito,
 * mas lido ao pé da letra sem o acento o TTS tende a fechar a vogal
 * errado. Nunca mexe no que é MOSTRADO (a tela sempre usa o texto
 * original, ver `Mascot`/`Widget`) - só no que é ENVIADO pra fala, via
 * `toSpeechText` abaixo. Lista pequena de propósito: só entra aqui uma
 * palavra depois de confirmado que soa errado de verdade, não uma
 * tentativa de prever tudo.
 */
const PRONUNCIATION_OVERRIDES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bvei\b/gi, "véi"],
];

/** Aplica as substituições de `PRONUNCIATION_OVERRIDES` — usada por
 * `speak` (nunca pelo texto exibido na tela). Exportada só pra teste. */
export function toSpeechText(text: string): string {
  return PRONUNCIATION_OVERRIDES.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    text
  );
}

/**
 * Estado de fala GLOBAL (módulo, não por hook) — antes, cada `useSpeak()`
 * guardava seu próprio `isSpeaking` local, então o Widget, o mascote do
 * Foco e o Companion de Tarefas podiam chamar `speak()` ao mesmo tempo
 * sem nenhum saber do outro: a fala mais nova começava a tocar POR CIMA
 * da mais velha (Edge TTS usa um `<audio>` novo a cada chamada, sem
 * cancelar o anterior) — dois áudios sobrepostos, ou pior, o balão já
 * mostrando a mensagem B enquanto o áudio da mensagem A ainda toca
 * (bug relatado: "o balão e o TTS podem comunicar conteúdo diferente").
 * Um único ponto de verdade aqui resolve os dois problemas de uma vez:
 * toda chamada nova cancela a anterior (nativa OU Edge TTS) antes de
 * começar, e ninguém mais precisa saber disso pra usar `speak()`.
 */
let currentAudio: HTMLAudioElement | null = null;
let currentGeneration = 0;
const speakingListeners = new Set<(isSpeaking: boolean) => void>();
let isSpeakingGlobal = false;

function setSpeakingGlobal(value: boolean) {
  if (isSpeakingGlobal === value) return;
  isSpeakingGlobal = value;
  speakingListeners.forEach((listener) => listener(value));
}

/** Para qualquer fala em andamento (nativa ou Edge TTS) na hora, sem
 * esperar ela terminar sozinha - chamado no início de toda `speak()` nova
 * e disponível para quem precisa silenciar sem falar nada em seguida
 * (ex.: usuário muta o Companion no meio de uma fala automática). */
export function stopSpeaking(): void {
  currentGeneration++;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  setSpeakingGlobal(false);
}

/** Devolve uma Promise que resolve quando a fala nativa termina (ou na
 * hora, se o navegador não suportar, ou se uma fala mais nova cancelou
 * esta no meio do caminho). */
function speakNative(text: string, generation: number): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    // Se outra `speak()` já assumiu a geração atual entre o cancelamento
    // e este ponto, não fala por cima dela.
    if (generation !== currentGeneration) {
      resolve();
      return;
    }

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Sintetiza e toca uma fala do mascote — compartilhado por TODO lugar que
 * fala com a voz do personagem (Widget, Foco, Companion de Tarefas).
 * Tenta a voz mais natural do Edge TTS (via `/api/mascot-speech`, sem
 * custo, mas API não-oficial e sem garantia de uptime); se falhar por
 * qualquer motivo, cai pro `speechSynthesis` nativo do navegador. Sempre
 * cancela qualquer fala anterior (de qualquer chamador) antes de começar
 * - nunca duas vozes sobrepostas, nunca uma fala velha terminando depois
 * que o conteúdo visível já mudou. Só resolve quando o áudio termina (ou
 * é cancelado por uma chamada mais nova).
 */
export async function speak(text: string): Promise<void> {
  const speechText = toSpeechText(text);
  stopSpeaking();
  const generation = currentGeneration;
  setSpeakingGlobal(true);

  try {
    const response = await fetch("/api/mascot-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: speechText }),
    });

    // Uma fala mais nova pode ter cancelado esta enquanto a rede
    // respondia - nunca troca `currentAudio` nem toca nada nesse caso.
    if (generation !== currentGeneration) return;

    if (!response.ok) {
      await speakNative(speechText, generation);
      return;
    }

    const blob = await response.blob();
    if (generation !== currentGeneration) return;

    const audio = new Audio(URL.createObjectURL(blob));
    currentAudio = audio;

    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  } catch {
    if (generation === currentGeneration) {
      await speakNative(speechText, generation);
    }
  } finally {
    if (generation === currentGeneration) {
      currentAudio = null;
      setSpeakingGlobal(false);
    }
  }
}

function subscribeSpeaking(listener: (isSpeaking: boolean) => void): () => void {
  speakingListeners.add(listener);
  return () => speakingListeners.delete(listener);
}

/**
 * Hook fino sobre o estado de fala GLOBAL (ver acima) - `isSpeaking`
 * reflete se QUALQUER chamador está falando agora, não só este
 * componente, então um indicador visual (ex.: ícone de mudo) fica
 * correto mesmo quando outra parte da tela é quem disparou a fala.
 */
export function useSpeak() {
  const [isSpeaking, setIsSpeaking] = useState(isSpeakingGlobal);

  useEffect(() => subscribeSpeaking(setIsSpeaking), []);

  return { isSpeaking, speak };
}
