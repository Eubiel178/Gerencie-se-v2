"use client";

import { Icon } from "@/components/icon";

import styles from "./styles.module.css";

interface SpeechBubbleProps {
  text: string;
  onDismiss: () => void;
}

/**
 * Balão de fala espontâneo perto do mascote - só texto curto, nunca um
 * chat (isso já existe no Widget do Assistant). Renderizado dentro de um
 * container posicionado imperativamente pelo `MascotRuntime` (ver
 * `onPositionChange` em `engine/runtime.ts`), então este componente não
 * precisa saber onde o bichinho está.
 *
 * De propósito SEM botões de ouvir/mudo aqui dentro - um balão com uma
 * fileira de ícones parece um player de áudio, não o próprio mascote
 * falando (achado do brief). Fala automática é controlada pelo ícone
 * PERSISTENTE junto do mascote (ver `MuteToggle`), não por botão
 * repetido em cada balão; "ouvir de novo" não existe mais como conceito
 * separado porque a fala já acontece sozinha quando habilitada. Só o
 * fechar continua aqui, pequeno e discreto, pra nunca virar uma barra de
 * ferramentas.
 */
export function SpeechBubble({ text, onDismiss }: SpeechBubbleProps) {
  return (
    <div className={styles.bubble} role="status" aria-live="polite">
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Fechar mensagem"
        onClick={onDismiss}
      >
        <Icon name="MdClose" aria-hidden="true" size={10} />
      </button>
      <p className={styles.text}>{text}</p>
      <span className={styles.tail} aria-hidden="true" />
    </div>
  );
}
