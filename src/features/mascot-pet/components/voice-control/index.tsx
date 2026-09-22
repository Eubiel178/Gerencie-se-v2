"use client";

import styles from "./styles.module.css";

interface VoiceControlProps {
  onAnswerPrompt: (enable: boolean) => void;
}

/**
 * Convite ÚNICO "quer que eu fale às vezes?" - só aparece depois que o
 * Companion já mostrou algo de verdade (ver `mascot-pet/index.tsx`), e só
 * uma vez por conta (nunca mais depois de respondido).
 *
 * O CONTROLE PERSISTENTE de voz (ligar/desligar depois desse convite)
 * morava aqui antes como um botão flutuando sozinho - motivo de queixa
 * real ("a pessoa vê e não sabe do que aquilo é", posição confusa longe
 * de qualquer contexto). Ele virou um selo preso ao PRÓPRIO bichinho
 * (`.voiceBadge` em `mascot-pet/styles.module.css`, ancorado via
 * `onPositionChange` em `mascot-pet/index.tsx`) - grudado na borda do
 * personagem, lê como "isso é sobre ele falar" só de olhar.
 */
export function VoiceControl({ onAnswerPrompt }: VoiceControlProps) {
  return (
    <div className={styles.prompt} role="dialog" aria-label="Preferência de voz do Companion">
      <p className={styles.promptText}>Quer que eu fale às vezes, além de escrever?</p>
      <div className={styles.promptActions}>
        <button
          type="button"
          className={styles.promptButton}
          data-variant="primary"
          onClick={() => onAnswerPrompt(true)}
        >
          Quero
        </button>
        <button type="button" className={styles.promptButton} onClick={() => onAnswerPrompt(false)}>
          Só texto
        </button>
      </div>
    </div>
  );
}
