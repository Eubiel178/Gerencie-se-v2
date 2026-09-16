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
  // Estado otimista, não só a prop `enabled` (valor vindo do servidor) —
  // antes o `checked` do checkbox dependia inteiramente de
  // `router.refresh()` completar e o Server Component pai reenviar a
  // prop atualizada, então o clique não tinha NENHUM efeito visível até
  // esse round-trip terminar (achado relatado: "clica pra receber
  // e-mail, dá um bugzinho, não marca certo"). Mesmo padrão de
  // `PushToggle` (estado local que já reflete o resultado da operação,
  // sem esperar o servidor confirmar de volta).
  const [checked, setChecked] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);

  async function handleToggle(nextChecked: boolean) {
    setChecked(nextChecked);
    setIsSaving(true);

    const result = await updateEmailTaskRemindersPreferenceAction(nextChecked);

    if (result.error) {
      // Falha real: desfaz o otimismo, senão o checkbox mentiria sobre
      // o que de fato ficou salvo.
      setChecked(!nextChecked);
    } else {
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <label className={styles.row}>
      <input
        type="checkbox"
        checked={checked}
        disabled={isSaving}
        onChange={(event) => handleToggle(event.target.checked)}
      />
      <span>E-mail</span>
    </label>
  );
}
