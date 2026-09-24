"use client";

import { useState } from "react";

import { Alert, Button, SwitchRow } from "@/components";

import { updateWeeklySummaryPreferenceAction, sendTestWeeklySummaryAction } from "../../actions";

import styles from "./styles.module.css";

interface WeeklySummaryPanelProps {
  enabled: boolean;
  email: string | null;
}

export function WeeklySummaryPanel({ enabled, email }: WeeklySummaryPanelProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleToggle(checked: boolean) {
    if (isSaving) return;

    setIsSaving(true);
    setActionError(null);

    try {
      const result = await updateWeeklySummaryPreferenceAction(checked);
      if (result.error) {
        setActionError(result.error);
        return;
      }

      setIsEnabled(checked);
    } finally {
      setIsSaving(false);
    }
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
      <SwitchRow
        title="E-mail"
        helper="Um resumo do seu progresso toda semana."
        checked={isEnabled}
        disabled={isSaving}
        onChange={(checked) => void handleToggle(checked)}
      />

      {actionError && <Alert variant="error">{actionError}</Alert>}

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
