"use client";

import { useState } from "react";

import { Button, Modal, ModalHeader } from "@/components";
import { Icon, IconName } from "@/components/icon";

import styles from "./styles.module.css";

export interface ConfirmIconButtonProps {
  /** Ícone do botão em repouso (ex.: "FaTrash"). */
  icon: IconName;
  /** `aria-label` do botão em repouso — ex. `Excluir tarefa "${title}"`. */
  ariaLabel: string;
  /** Texto da pergunta de confirmação — ex. "Excluir esta tarefa?". */
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  /** Aplicada só no botão em repouso — usado pelas listas que precisam de
   * um botão menor (ex. etapa de tarefa/objetivo dentro de uma lista). */
  className?: string;
}

/**
 * Botão de ação destrutiva (excluir) com confirmação num popup de
 * verdade (reaproveita `Modal` — mesmo componente usado em todo o resto
 * do app, com fundo escurecido, cancelar no Escape/clique fora, e trava
 * de foco) — antes cada lista (tarefas, hábitos, metas, rotina, eventos,
 * leitura, corrida, saúde, ciclo, anexos, passos) excluía direto no
 * clique, sem chance de desfazer um toque acidental.
 */
export function ConfirmIconButton({
  icon,
  ariaLabel,
  confirmText,
  onConfirm,
  loading,
  disabled,
  className,
}: ConfirmIconButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    await onConfirm();
    setIsConfirming(false);
  }

  return (
    <>
      <Button.Preset
        icon={{ name: icon }}
        root={{
          tone: "danger",
          className,
          "aria-label": ariaLabel,
          disabled,
          onClick: () => setIsConfirming(true),
        }}
      />

      {isConfirming && (
        <Modal onClose={() => setIsConfirming(false)}>
          <ModalHeader title="Confirmar" onClose={() => setIsConfirming(false)} />

          <div className={styles.body}>
            <span className={styles.icon} aria-hidden="true">
              <Icon name={icon} />
            </span>
            <p className={styles.text}>{confirmText}</p>
          </div>

          <div className={styles.actions}>
            <Button.Root type="button" variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancelar
            </Button.Root>
            <Button.Root type="button" tone="danger" loading={loading} onClick={handleConfirm}>
              Confirmar
            </Button.Root>
          </div>
        </Modal>
      )}
    </>
  );
}
