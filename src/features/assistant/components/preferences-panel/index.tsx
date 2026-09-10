"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Feedback, Paragraph, Wrapper } from "@/components";

import { updateAssistantPreferencesAction } from "@/features/assistant/actions";
import { IAssistantPreferences } from "@/features/assistant/domain";

import styles from "./preferences-panel.module.css";

export function PreferencesPanel({ preferences }: { preferences: IAssistantPreferences }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(patch: Partial<IAssistantPreferences>) {
    setIsSaving(true);
    setError(null);

    const result = await updateAssistantPreferencesAction(patch);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <Wrapper direction="column" gap="small">
      <label className={styles.row}>
        <input
          type="checkbox"
          checked={preferences.enabled}
          disabled={isSaving}
          onChange={(event) => handleToggle({ enabled: event.target.checked })}
        />
        <span>Mostrar o assistente (JARVIS)</span>
      </label>

      <label className={styles.row} data-disabled={!preferences.enabled}>
        <input
          type="checkbox"
          checked={preferences.reducedPresence}
          disabled={isSaving || !preferences.enabled}
          onChange={(event) => handleToggle({ reducedPresence: event.target.checked })}
        />
        <span>Presença reduzida (não abrir mensagens sozinho)</span>
      </label>

      <Paragraph size="small" color="secondary">
        O assistente observa suas tarefas, hábitos e metas para sugerir o
        que fazer a seguir — nunca acessa nada fora disso.
      </Paragraph>

      {error && <Feedback type="error">{error}</Feedback>}
    </Wrapper>
  );
}
