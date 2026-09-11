"use client";

import styles from "./suggestion-chips.module.css";

interface SuggestionChipsProps {
  label: string;
  suggestions: string[];
  onSelect: (value: string) => void;
}

/** Chips de preenchimento rápido acima de um campo de texto livre — clicar
 * preenche o campo, sem obrigar a digitar do zero um valor comum (ex.:
 * "Beber água" num hábito novo). Puramente uma sugestão: o campo continua
 * 100% editável depois. */
export function SuggestionChips({ label, suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label} — clique para preencher</span>

      <div className={styles.row}>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className={styles.chip}
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
