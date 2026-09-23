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
  /** Texto da pergunta de confirmação — ex. `Excluir "${task.title}"?`,
   *  sempre com o nome real do item quando existir um. */
  confirmText: string;
  /** Rótulo do botão de confirmação — verbo curto e específico da ação
   *  ("Excluir", "Remover", "Desconectar", "Encerrar"), nunca "Confirmar"
   *  genérico. Padrão "Excluir" (caso mais comum nesse componente). */
  confirmLabel?: string;
  /** "danger" (padrão) pra ações destrutivas de verdade (excluir,
   *  remover, desconectar) — ícone, botão de repouso e botão de confirmar
   *  em vermelho. "neutral" pra ações relevantes mas NÃO destrutivas que
   *  ainda merecem confirmação (ex.: reabrir uma tarefa já concluída) —
   *  mesma estrutura de popup, sem a cor de perigo. */
  severity?: "danger" | "neutral";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  /** Aplicada só no botão em repouso — usado pelas listas que precisam de
   * um botão menor (ex. etapa de tarefa/objetivo dentro de uma lista). */
  className?: string;
}

/**
 * Botão de ação com confirmação num popup de verdade (reaproveita `Modal`
 * — mesmo componente usado em todo o resto do app, com fundo escurecido,
 * cancelar no Escape/clique fora, e trava de foco) — antes cada lista
 * (tarefas, hábitos, metas, rotina, eventos, leitura, corrida, saúde,
 * ciclo, anexos, passos) excluía direto no clique, sem chance de desfazer
 * um toque acidental. `severity="danger"` (padrão) é o caso mais comum
 * (excluir/remover); `severity="neutral"` existe pras poucas ações não
 * destrutivas que ainda merecem uma confirmação explícita.
 */
export function ConfirmIconButton({
  icon,
  ariaLabel,
  confirmText,
  confirmLabel = "Excluir",
  severity = "danger",
  onConfirm,
  loading,
  disabled,
  className,
}: ConfirmIconButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const tone = severity === "danger" ? "danger" : "highlight";

  async function handleConfirm() {
    await onConfirm();
    setIsConfirming(false);
  }

  return (
    <>
      <Button.Preset
        icon={{ name: icon }}
        root={{
          type: "button",
          tone,
          className,
          "aria-label": ariaLabel,
          disabled,
          onClick: () => setIsConfirming(true),
        }}
      />

      {isConfirming && (
        <Modal onClose={() => setIsConfirming(false)}>
          <ModalHeader title={confirmText} onClose={() => setIsConfirming(false)} />

          <div className={styles.body}>
            <span
              className={`${styles.icon} ${severity === "neutral" ? styles.iconNeutral : ""}`}
              aria-hidden="true"
            >
              <Icon name={icon} />
            </span>
          </div>

          <div className={styles.actions}>
            <Button.Root type="button" variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancelar
            </Button.Root>
            <Button.Root type="button" tone={tone} loading={loading} onClick={handleConfirm}>
              {confirmLabel}
            </Button.Root>
          </div>
        </Modal>
      )}
    </>
  );
}
