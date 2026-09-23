"use client";

import { useState } from "react";

import { Button, Modal, ModalHeader } from "@/components";
import { Icon } from "@/components/icon";

import styles from "./styles.module.css";

export interface ConfirmCheckboxProps {
  /** Estado atual — controla o ícone de check e o `data-checked`/`aria-pressed`
   *  do botão em repouso (mesma marcação visual que já existia antes de
   *  virar confirmável). */
  checked: boolean;
  /** `aria-label` do botão em repouso — ex. `Marcar tarefa "X" como concluída`. */
  ariaLabel: string;
  /** Pergunta de confirmação — ex. `Concluir a tarefa "X"?` ou
   *  `Marcar a tarefa "X" como não concluída?`, computada pelo chamador a
   *  partir do estado atual (`checked`). */
  confirmText: string;
  /** Rótulo do botão de confirmação — verbo curto ("Concluir", "Reabrir"). */
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  /** Classe do botão em repouso — cada lista (Tarefas, Objetivos) já tem
   *  seu próprio `.completeCheckbox` com o visual de "quadradinho com
   *  check"; este componente só adiciona a confirmação por cima, sem
   *  reinventar esse estilo. */
  className?: string;
}

/**
 * Igual ao `ConfirmIconButton`, mas pro caso de um checkbox de conclusão
 * (Tarefa/Objetivo): clicar não completa na hora — abre um popup real
 * (mesmo `Modal` do resto do app) perguntando antes, sem o tom de perigo
 * do excluir (marcar/desmarcar como concluído não é destrutivo).
 * Hábito/Rotina ficam de fora de propósito: lá o checkbox registra uma
 * ocorrência do dia (ação frequente e reversível com um novo clique), não
 * uma conclusão única — confirmar ali seria irritante, não útil.
 */
export function ConfirmCheckbox({
  checked,
  ariaLabel,
  confirmText,
  confirmLabel,
  onConfirm,
  loading,
  disabled,
  className,
}: ConfirmCheckboxProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    await onConfirm();
    setIsConfirming(false);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        data-checked={checked}
        aria-pressed={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setIsConfirming(true)}
      >
        {checked && <Icon name="FaCheck" aria-hidden="true" />}
      </button>

      {isConfirming && (
        <Modal onClose={() => setIsConfirming(false)}>
          <ModalHeader title={confirmText} onClose={() => setIsConfirming(false)} />

          <div className={styles.actions}>
            <Button.Root
              type="button"
              variant="secondary"
              onClick={() => setIsConfirming(false)}
            >
              Cancelar
            </Button.Root>
            <Button.Root
              type="button"
              tone="highlight"
              loading={loading}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button.Root>
          </div>
        </Modal>
      )}
    </>
  );
}
