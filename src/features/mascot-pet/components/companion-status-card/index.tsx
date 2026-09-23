"use client";

import { Icon } from "@/components/icon";

import styles from "./styles.module.css";

interface CompanionStatusCardProps {
  text: string;
  onDismiss: () => void;
}

/**
 * Aparece quando a pessoa CLICA no mascote (nunca ao arrastar - ver
 * `handlePointerUp` em `engine/runtime.ts` pra distinção clique/arraste).
 * Visualmente parecido com o balão de fala espontâneo (mesmo ancoradouro,
 * mesmo "rabicho"), mas com um acento diferente (borda suave em vez de
 * sombra só) pra ler como "conferir como o bichinho está" - uma ação
 * ocasional e íntima da pessoa - e não como mais uma coisa que ele quis
 * dizer por conta própria.
 *
 * De propósito SEM nenhum botão de ação e SEM disparar fala automática
 * (ver `mascot-pet/index.tsx`) - isto é a pessoa perguntando, não o
 * Companion iniciando algo; abrir isso nunca deveria soar como uma nova
 * interação espontânea nem competir com o volume/limite de espaço que
 * governam essas.
 */
export function CompanionStatusCard({ text, onDismiss }: CompanionStatusCardProps) {
  return (
    <div className={styles.card} role="status" aria-live="polite">
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Fechar"
        onClick={onDismiss}
      >
        <Icon name="MdClose" aria-hidden="true" size={10} />
      </button>
      <p className={styles.text}>{text}</p>
      <span className={styles.tail} aria-hidden="true" />
    </div>
  );
}
