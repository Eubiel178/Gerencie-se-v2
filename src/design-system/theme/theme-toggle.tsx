"use client";

import { ThemePreference, useTheme } from "./use-theme";

import styles from "./styles.module.css";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

interface ThemeToggleProps {
  /** Encolhe em telas estreitas (ver `.compact` no CSS) - só tem efeito
   * dentro do breakpoint mobile já documentado em `tokens.css`, nunca no
   * tamanho normal do componente em telas largas. Usado hoje só no
   * cabeçalho da landing page, o único lugar onde o seletor de tema
   * precisa dividir espaço com marca + "Entrar" numa faixa estreita
   * (achado em auditoria visual: sem isso, "Entrar" ficava cortado). */
  compact?: boolean;
}

export function ThemeToggle({ compact }: ThemeToggleProps = {}) {
  const { preference, setPreference } = useTheme();
  const groupClassName = compact ? `${styles.group} ${styles.compact}` : styles.group;

  return (
    <div className={groupClassName} role="group" aria-label="Tema da interface">
      {OPTIONS.map((option) => {
        const isActive = preference === option.value;

        let classNames = styles.option;

        if (isActive) {
          classNames = classNames + " " + styles.optionActive;
        }

        return (
          <button
            key={option.value}
            type="button"
            className={classNames}
            aria-pressed={isActive}
            onClick={() => setPreference(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
