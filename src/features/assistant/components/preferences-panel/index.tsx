"use client";

import { useState } from "react";

import { updateAssistantPreferencesAction } from "@/features/assistant/actions";
import { IAssistantPreferences } from "@/features/assistant/domain";

import styles from "./styles.module.css";

interface PreferencesPanelProps {
  preferences: IAssistantPreferences;
  // Nome que o usuário deu ao mascote — o assistente É o mascote, então
  // o toggle fala por esse nome em vez do genérico "JARVIS".
  mascotName: string;
}

export function PreferencesPanel({ preferences, mascotName }: PreferencesPanelProps) {
  const [visiblePreferences, setVisiblePreferences] = useState(preferences);
  const [previousPreferences, setPreviousPreferences] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (preferences !== previousPreferences) {
    setPreviousPreferences(preferences);
    setVisiblePreferences(preferences);
  }

  async function handleToggle(patch: Partial<IAssistantPreferences>) {
    setIsSaving(true);
    setError(null);

    const result = await updateAssistantPreferencesAction(patch);

    if (result.error) {
      setError(result.error);
    } else {
      setVisiblePreferences((current) => ({ ...current, ...patch }));
    }

    setIsSaving(false);
  }

  return (
    <div className={styles.panel}>
      <label className={styles.row}>
        <input
          type="checkbox"
          checked={visiblePreferences.enabled}
          disabled={isSaving}
          onChange={(event) => handleToggle({ enabled: event.target.checked })}
        />
        <span>Companion ativo ({mascotName})</span>
      </label>

      <label className={styles.row} data-disabled={!visiblePreferences.enabled}>
        <input
          type="checkbox"
          checked={visiblePreferences.reducedPresence}
          disabled={isSaving || !visiblePreferences.enabled}
          onChange={(event) => handleToggle({ reducedPresence: event.target.checked })}
        />
        <span>Presença reduzida (não abrir mensagens sozinho)</span>
      </label>

      <label className={styles.row} data-disabled={!visiblePreferences.enabled}>
        <input
          type="checkbox"
          checked={visiblePreferences.autoSpeechEnabled}
          disabled={isSaving || !visiblePreferences.enabled}
          onChange={(event) => handleToggle({ autoSpeechEnabled: event.target.checked })}
        />
        <span>
          Voz automática do Companion (o mesmo ícone de som fixo no canto
          da tela também liga/desliga isso na hora)
        </span>
      </label>

      <p className={styles.note}>
        Desligar o Companion para as interações proativas por completo (nem
        balão, nem sugestões). Desligar só a voz mantém as mensagens
        escritas, sem falar sozinho. O Companion observa suas tarefas,
        hábitos e objetivos para sugerir o que fazer a seguir — nunca
        acessa nada fora disso.
      </p>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
