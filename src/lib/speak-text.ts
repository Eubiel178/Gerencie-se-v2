"use client";

import { useState } from "react";

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

/** Devolve uma Promise que resolve quando a fala nativa termina (ou na
 * hora, se o navegador não suportar) — sem isso, quem chama não teria
 * como saber quando liberar o botão de novo. */
function speakNative(text: string): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Sintetiza e toca uma fala do mascote — compartilhado entre o Focus
 * (`Mascot`) e o widget do assistente na sidebar/canto da tela, já que os
 * dois falam com a voz do mesmo personagem. Tenta a voz mais natural do
 * Edge TTS (via `/api/mascot-speech`, sem custo, mas API não-oficial e
 * sem garantia de uptime); se falhar por qualquer motivo, cai pro
 * `speechSynthesis` nativo do navegador. Só resolve quando o áudio (de um
 * jeito ou de outro) termina de tocar, pra quem chama travar o botão de
 * ouvir até a fala acabar.
 */
export async function speak(text: string): Promise<void> {
  const speechText = toSpeechText(text);

  try {
    const response = await fetch("/api/mascot-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: speechText }),
    });

    if (!response.ok) {
      await speakNative(speechText);
      return;
    }

    const blob = await response.blob();
    const audio = new Audio(URL.createObjectURL(blob));

    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play();
    });
  } catch {
    await speakNative(speechText);
  }
}

/**
 * Envolve `speak` com a trava contra clique repetido: enquanto uma fala
 * está tocando, chamar de novo não empilha outra por cima (nem do Edge
 * TTS, nem do nativo) - só libera quando a atual realmente termina.
 * Compartilhado pelo mascote do Focus e pelo widget do assistente, que
 * falam com a voz do mesmo personagem.
 */
export function useSpeak() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  async function trigger(text: string) {
    if (isSpeaking) return;

    setIsSpeaking(true);
    try {
      await speak(text);
    } finally {
      setIsSpeaking(false);
    }
  }

  return { isSpeaking, speak: trigger };
}
