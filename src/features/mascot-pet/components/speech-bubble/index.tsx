"use client";

import { Icon } from "@/components/icon";
import type { CompanionActionOption } from "@/features/execution-companion/domain/companion-moves";

import styles from "./styles.module.css";

interface SpeechBubbleProps {
  text: string;
  /** Tarefa real por trás desta mensagem - ver `ActiveCompanionMessage`
   * em `use-tasks-companion.ts`: SEMPRE a tarefa que gerou a mensagem,
   * nunca "a tarefa ativa agora" (podem ser diferentes se outra virou a
   * sessão rastreada entre a geração e a exibição). `null`/omitido = a
   * interação não é sobre nenhuma tarefa específica. Mostrado como uma
   * legenda pequena e discreta - clareza sobre QUAL tarefa sem precisar
   * repetir o título dentro de toda frase. */
  taskTitle?: string | null;
  /** Ações contextuais (0 a 2) - só existem quando há uma decisão real
   * pra tomar (ver `companion-moves.ts`); a maioria das mensagens não
   * tem nenhuma, de propósito (nunca virar barra de botões). */
  actions?: CompanionActionOption[];
  onDismiss: () => void;
  onAction?: (actionId: string) => void;
  /** Pausa/retoma o auto-fechamento enquanto o mouse/foco está no balão -
   * nunca deveria sumir sozinho enquanto alguém está lendo ou prestes a
   * clicar numa ação. */
  onPauseAutoDismiss?: () => void;
  onResumeAutoDismiss?: () => void;
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
 * ferramentas - e fechar significa SÓ "fechar esta mensagem", nunca
 * "fale menos comigo" (isso tem seu próprio caminho explícito, ver
 * `ask-quiet-check` em `use-tasks-companion.ts`).
 */
export function SpeechBubble({
  text,
  taskTitle,
  actions,
  onDismiss,
  onAction,
  onPauseAutoDismiss,
  onResumeAutoDismiss,
}: SpeechBubbleProps) {
  return (
    <div
      className={styles.bubble}
      role="status"
      aria-live="polite"
      onMouseEnter={onPauseAutoDismiss}
      onMouseLeave={onResumeAutoDismiss}
      onFocus={onPauseAutoDismiss}
      onBlur={onResumeAutoDismiss}
    >
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Fechar mensagem"
        onClick={onDismiss}
      >
        <Icon name="MdClose" aria-hidden="true" size={10} />
      </button>
      {taskTitle && <p className={styles.taskTag}>{taskTitle}</p>}
      <p className={styles.text}>{text}</p>
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={styles.actionButton}
              data-kind={action.kind}
              onClick={() => onAction?.(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <span className={styles.tail} aria-hidden="true" />
    </div>
  );
}
