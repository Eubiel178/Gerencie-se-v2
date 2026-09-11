"use client";

import { ThemePreference, useTheme } from "./use-theme";

import styles from "./styles.module.css";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div className={styles.group} role="group" aria-label="Tema da interface">
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
