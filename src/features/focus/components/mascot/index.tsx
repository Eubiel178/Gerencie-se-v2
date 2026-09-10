import { IMascotState } from "@/features/focus/domain";

import styles from "./mascot.module.css";

export type MascotMood = "idle" | "working" | "happy";

interface MascotProps {
  mascot: IMascotState;
  mood: MascotMood;
}

/** Criatura original do Focus Timer — não é uma árvore, de propósito.
 * Estados visuais (olhos + bochechas + brilhos) mudam com `mood`:
 * idle (parada), working (concentrada, olhos semicerrados), happy
 * (acabou de completar uma sessão, ganha XP). */
export function Mascot({ mascot, mood }: MascotProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.creature} data-mood={mood} aria-hidden="true">
        <div className={styles.eyes}>
          <span className={styles.eye} />
          <span className={styles.eye} />
        </div>
        <div className={styles.cheeks}>
          <span className={styles.cheek} />
          <span className={styles.cheek} />
        </div>
        {mood === "happy" && (
          <>
            <span className={`${styles.sparkle} ${styles.sparkleOne}`}>✦</span>
            <span className={`${styles.sparkle} ${styles.sparkleTwo}`}>✦</span>
          </>
        )}
      </div>

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
