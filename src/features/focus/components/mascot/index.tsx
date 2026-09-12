"use client";

import { Button } from "@/components";
import { IMascotState, MascotEvent, getMascotLine } from "@/features/focus/domain";
import { useSpeak } from "@/lib/speak-text";
import { MascotSprite } from "@/features/focus/components/mascot-sprite";

import styles from "./mascot.module.css";

interface MascotProps {
  mascot: IMascotState;
  mood: MascotEvent;
}

/** Mascote do Focus Timer — um animal de fazenda (sprite estático + CSS,
 * ver `MascotSprite`), não uma criatura abstrata. Estados visuais mudam
 * com `mood`: idle (respirando), working (respirando mais rápido),
 * happy (pulinho + brilhos, acabou de completar uma sessão e ganhar XP).
 * A fala no balão muda de acordo com a personalidade escolhida em
 * Configurações. Esse mesmo personagem (nome/espécie/personalidade/voz)
 * também é quem "fala" no widget do assistente (JARVIS) espalhado pelo
 * resto do app — são o mesmo ser, não dois bichinhos diferentes. */
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

      <MascotSprite species={mascot.species} breed={mascot.breed} mood={mood} roaming />

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
