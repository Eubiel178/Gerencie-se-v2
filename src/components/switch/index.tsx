"use client";

import { forwardRef, useId } from "react";

import styles from "./styles.module.css";

export interface SwitchProps extends Omit<React.ComponentProps<"button">, "type" | "role" | "aria-checked" | "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Interruptor (switch) reutilizável do Design System. É um `<button>` com
 * `role="switch"`: o estado fica em `aria-checked` (lido por leitores de
 * tela) e alterna por Espaço/Enter nativamente. O knob anda por CSS com
 * `prefers-reduced-motion` respeitado. Os textos ficam fora (ver
 * `SwitchRow`) — aqui só o controle, pra poder ser usado em tabelas/lists
 * onde o rótulo vive em outra célula/linha.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, disabled, className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`${styles.track} ${checked ? styles.trackOn : ""} ${className ?? ""}`}
      onClick={() => onChange(!checked)}
      {...rest}
    >
      <span className={`${styles.knob} ${checked ? styles.knobOn : ""}`} aria-hidden="true" />
    </button>
  );
});

export interface SwitchRowProps {
  /** Título curto do interruptor (rótulo acessível vindo daqui). */
  title: string;
  /** Ajuda de no máximo uma linha, opcional. */
  helper?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Linha de configuração liga/desliga: texto à esquerda, switch à direita —
 * o padrão repetido nas preferências booleanas (Companion, resumo semanal,
 * e-mail de lembrete). A linha inteira clica alterna o switch; o helper é
 * uma linha só, sem pedir leitura pra operar o controle.
 */
export function SwitchRow({ title, helper, checked, onChange, disabled, className }: SwitchRowProps) {
  const id = useId();
  const titleId = `${id}-title`;

  return (
    <div className={`${styles.row} ${className ?? ""}`}>
      <div className={styles.rowText}>
        <span className={styles.rowTitle} id={titleId}>
          {title}
        </span>
        {helper ? <span className={styles.rowHelper}>{helper}</span> : null}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} aria-labelledby={titleId} />
    </div>
  );
}