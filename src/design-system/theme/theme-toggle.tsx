"use client";

import { ThemePreference, useTheme } from "./use-theme";

import styles from "./theme-toggle.module.css";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div className={styles.group} role="group" aria-label="Tema da interface">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={[styles.option, preference === option.value ? styles.optionActive : ""]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
