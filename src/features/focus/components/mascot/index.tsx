"use client";

import { useState } from "react";

import { Button } from "@/components";
import { IMascotState, MascotEvent, getMascotLine } from "@/features/focus/domain";
import { MascotCreature } from "./creature";

import styles from "./mascot.module.css";

interface MascotProps {
  mascot: IMascotState;
  mood: MascotEvent;
}

/** Devolve uma Promise que resolve quando a fala nativa termina (ou na
 * hora, se o navegador não suportar) — sem isso, `speak()` não teria como
 * saber quando liberar o botão de novo. */
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

/** Tenta a voz mais natural do Edge TTS (via `/api/mascot-speech`, sem
 * custo, mas API não-oficial e sem garantia de uptime); se falhar por
 * qualquer motivo, cai pro `speechSynthesis` nativo do navegador. Só
 * resolve quando o áudio (de um jeito ou de outro) termina de tocar —
 * `Mascot` usa isso pra travar o botão de ouvir até a fala acabar,
 * evitando várias falas sobrepostas se clicar repetido.
 */
async function speak(text: string): Promise<void> {
  try {
    const response = await fetch("/api/mascot-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      await speakNative(text);
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
    await speakNative(text);
  }
}

/** Criatura original do Focus Timer — não é uma árvore, de propósito.
 * Estados visuais (olhos + bochechas + brilhos) mudam com `mood`:
 * idle (parada), working (concentrada, olhos semicerrados), happy
 * (acabou de completar uma sessão, ganha XP). A fala no balão muda de
 * acordo com a personalidade escolhida em Configurações. */
export function Mascot({ mascot, mood }: MascotProps) {
  const line = getMascotLine(mascot.personality, mood, mascot);
  const [isSpeaking, setIsSpeaking] = useState(false);

  async function handleSpeak() {
    // Trava contra clique repetido: enquanto uma fala está tocando, um
    // novo clique não empilha outra por cima (nem do Edge TTS, nem do
    // nativo) - só libera de novo quando a atual realmente termina.
    if (isSpeaking) return;

    setIsSpeaking(true);
    try {
      await speak(line);
    } finally {
      setIsSpeaking(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.speechRow}>
        <p className={styles.speechBubble}>{line}</p>

        <Button.Preset
          icon={{ name: "FaVolumeUp" }}
          root={{ "aria-label": "Ouvir a fala do mascote", loading: isSpeaking, onClick: handleSpeak }}
        />
      </div>

      <MascotCreature species={mascot.species} mood={mood} roaming />

      <p className={styles.name}>{mascot.name}</p>
      <p className={styles.level}>Nível {mascot.level}</p>

      <div className={styles.xpTrack} role="img" aria-label={`${mascot.xpIntoCurrentLevel} de ${mascot.xpForNextLevel} XP para o próximo nível`}>
        <div
          className={styles.xpFill}
          style={{ width: `${(mascot.xpIntoCurrentLevel / mascot.xpForNextLevel) * 100}%` }}
        />
      </div>
    </div>
  );
}
