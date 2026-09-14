"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateEmailTaskRemindersPreferenceAction } from "@/features/tasks/actions";

import styles from "./notifications-toggle.module.css";

interface EmailReminderToggleProps {
  enabled: boolean;
}

/**
 * Segundo canal de lembrete de tarefa (além do push, `PushToggle`) — só
 * tarefas têm lógica de vencimento pronta hoje (`computeDueReminders`),
 * por isso o e-mail só cobre esse tipo por enquanto.
 */
export function EmailReminderToggle({ enabled }: EmailReminderToggleProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleToggle(checked: boolean) {
    setIsSaving(true);

    const result = await updateEmailTaskRemindersPreferenceAction(checked);
    if (!result.error) router.refresh();

    setIsSaving(false);
  }

  return (
    <label className={styles.row}>
      <input
        type="checkbox"
        checked={enabled}
        disabled={isSaving}
        onChange={(event) => handleToggle(event.target.checked)}
      />
      <span>E-mail</span>
    </label>
  );
}
