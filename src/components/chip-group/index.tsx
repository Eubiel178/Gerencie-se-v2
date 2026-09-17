"use client";

import styles from "./styles.module.css";

export interface ChipOption {
  label: string;
  value: string;
  /** Cor do chip quando selecionado — puramente decorativo (ex.: verde
   * pra "Baixa", vermelho pra "Crítica"). Sem tone, usa a cor padrão. */
  tone?: "low" | "medium" | "high" | "critical";
}

interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
}

/**
 * Alternativa a `Input.FieldSelect` pra grupos pequenos (2-4 opções) onde
 * um dropdown esconde informação que caberia visível o tempo todo — cada
 * opção vira um botão, uma delas sempre marcada como selecionada.
 */
export function ChipGroup({ options, value, onChange, ...rest }: ChipGroupProps) {
  return (
    <div className={styles.row} role="radiogroup" aria-label={rest["aria-label"]}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          data-selected={value === option.value}
          data-tone={option.tone}
          className={styles.chip}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
