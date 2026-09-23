"use client";

import { Button } from "@/components";
import { IMascotState, MascotEvent, getMascotLine } from "@/features/focus/domain";
import { MascotPreview, characterIdForSpecies } from "@/features/mascot-pet";
import { MascotStateName } from "@/features/mascot-pet/domain/types";
import { useSpeak } from "@/lib/speech/speak-text";

import styles from "./styles.module.css";

const MOOD_TO_PREVIEW_STATE: Record<MascotEvent, MascotStateName> = {
  idle: "idle",
  working: "run",
  happy: "happy",
};

interface MascotProps {
  mascot: IMascotState;
  mood: MascotEvent;
}

/** Mascote do Focus Timer — mostra o MESMO personagem que anda pela tela
 * inteira (ver `MascotPreview`), só que parado aqui (quem "anda" de
 * verdade é só o PixiJS montado no layout - não existem dois bichinhos
 * andando). O estado visual muda com `mood`: idle, working (correndo),
 * happy (pulando, acabou de completar uma sessão e ganhar XP). A fala no
 * balão muda de acordo com a personalidade escolhida em Configurações.
 * Esse mesmo personagem (nome/espécie/personalidade/voz) também é quem
 * "fala" no widget do assistente (JARVIS) espalhado pelo resto do app —
 * são o mesmo ser, não dois bichinhos diferentes. */
export function Mascot({ mascot, mood }: MascotProps) {
  const line = getMascotLine(mascot.personality, mood, mascot);
  const { isSpeaking, speak: handleSpeak } = useSpeak();

  return (
    <div className={styles.wrapper}>
      <div className={styles.speechRow}>
        <p className={styles.speechBubble}>{line}</p>

        <Button.Preset
          icon={{ name: "FaVolumeUp", className: isSpeaking ? styles.speakingIcon : undefined }}
          root={{
            "aria-label": isSpeaking ? "Falando" : "Ouvir a fala do mascote",
            disabled: isSpeaking,
            onClick: () => handleSpeak(line),
          }}
        />
      </div>

      <MascotPreview
        characterId={characterIdForSpecies(mascot.species)}
        state={MOOD_TO_PREVIEW_STATE[mood]}
        scale={1.4}
      />

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
