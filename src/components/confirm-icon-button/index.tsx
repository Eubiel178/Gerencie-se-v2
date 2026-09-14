"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components";
import { IconName } from "@/components/icon";

import styles from "./confirm-icon-button.module.css";

export interface ConfirmIconButtonProps {
  /** Ícone do botão em repouso (ex.: "FaTrash"). */
  icon: IconName;
  /** `aria-label` do botão em repouso — ex. `Excluir tarefa "${title}"`. */
  ariaLabel: string;
  /** Texto mostrado ao lado dos ícones de confirmar/cancelar — ex.
   * "Excluir esta tarefa?". */
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  /** Aplicada só no botão em repouso — usado pelas listas que precisam de
   * um botão menor (ex. etapa de tarefa/objetivo dentro de uma lista). */
  className?: string;
}

/**
 * Botão de ação destrutiva (excluir) com confirmação em duas etapas —
 * mesmo padrão visual/interativo do "Sair" no Header (troca o próprio
 * botão por uma barra de confirmar/cancelar, em vez de abrir um modal),
 * só que reaproveitável: antes cada lista (tarefas, hábitos, metas,
 * rotina, eventos, leitura, corrida, saúde, ciclo, anexos, passos)
 * excluía direto no clique, sem chance de desfazer um toque acidental.
 *
 * Cancela sozinho ao clicar fora ou apertar Escape — nunca fica "armado"
 * esperando indefinidamente se a pessoa mudar de ideia e for fazer outra
 * coisa na tela.
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConfirming) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsConfirming(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsConfirming(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirming]);

  if (!isConfirming) {
    return (
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
    );
  }

  return (
    <div ref={containerRef} className={styles.confirmRow}>
      <span className={styles.confirmText}>{confirmText}</span>

      <Button.Preset
        icon={{ name: "MdClose" }}
        root={{ tone: "muted", "aria-label": "Cancelar", onClick: () => setIsConfirming(false) }}
      />

      <Button.Preset
        icon={{ name: "FaCheck" }}
        root={{
          tone: "danger",
          "aria-label": "Confirmar exclusão",
          loading,
          onClick: async () => {
            await onConfirm();
            setIsConfirming(false);
          },
        }}
      />
    </div>
  );
}
