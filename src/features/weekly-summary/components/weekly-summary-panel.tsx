"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components";
import { updateWeeklySummaryPreferenceAction, sendTestWeeklySummaryAction } from "../actions";

import styles from "./weekly-summary-panel.module.css";

interface WeeklySummaryPanelProps {
  enabled: boolean;
  email: string | null;
}

export function WeeklySummaryPanel({ enabled, email }: WeeklySummaryPanelProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function handleToggle(checked: boolean) {
    setIsSaving(true);

    const result = await updateWeeklySummaryPreferenceAction(checked);
    if (!result.error) router.refresh();

    setIsSaving(false);
  }

  async function handleSendTest() {
    if (isSendingTest) return;

    setIsSendingTest(true);
    setTestResult(null);

    const result = await sendTestWeeklySummaryAction();
    setTestResult(result.error ?? `Enviado para ${email}.`);
    setIsSendingTest(false);
  }

  return (
    <div className={styles.panel}>
      <label className={styles.row}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={isSaving}
          onChange={(event) => handleToggle(event.target.checked)}
        />
        <span>Receber resumo semanal por e-mail</span>
      </label>

      <p className={styles.note}>
        Um e-mail por semana com tarefas concluídas, sequência de hábitos,
        progresso das metas e o nível do mascote. Desligado por padrão.
      </p>

      <Button.Root
        type="button"
        variant="secondary"
        className={styles.testButton}
        loading={isSendingTest}
        onClick={handleSendTest}
      >
        Enviar um teste agora
      </Button.Root>

      {testResult && <p className={styles.testResult}>{testResult}</p>}
    </div>
  );
}
