"use client";

import { useEffect } from "react";

export interface ReminderTask {
  id: string;
  title: string;
  scheduledAt: string;
  reminderOffsetsMinutes: number[];
}

// Não agenda lembretes longe demais no futuro: setTimeout de dias fica
// impreciso (o navegador pode suspender o timer em segundo plano) e, como
// este efeito roda de novo a cada carregamento de página, um lembrete
// distante acaba sendo reagendado corretamente mais perto da hora de
// qualquer forma.
const MAX_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

/**
 * Dispara notificações do navegador para tarefas com lembrete configurado
 * — SÓ funciona com o Gerencie-se aberto em alguma aba: não existe um
 * servidor de push por trás disso, então fechar o navegador cancela os
 * lembretes pendentes. Essa limitação é avisada ao usuário em
 * Configurações (onde ele ativa a permissão), não escondida.
 *
 * Não pede permissão de notificação sozinho — só agenda se o usuário já
 * tiver concedido explicitamente (ver `NotificationsToggle` em
 * Configurações). Pedir permissão sem um gesto do usuário é mal visto
 * pelos navegadores e seria interromper por conta própria.
 */
export function ReminderScheduler({ tasks }: { tasks: ReminderTask[] }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();

    for (const task of tasks) {
      const scheduledMs = new Date(task.scheduledAt).getTime();
      if (Number.isNaN(scheduledMs)) continue;

      for (const offsetMinutes of task.reminderOffsetsMinutes) {
        const fireAt = scheduledMs - offsetMinutes * 60 * 1000;
        const delay = fireAt - now;

        if (delay < 0 || delay > MAX_LOOKAHEAD_MS) continue;

        const label =
          offsetMinutes === 0
            ? "Começa agora"
            : offsetMinutes < 60
              ? `Em ${offsetMinutes} min`
              : `Em ${Math.round(offsetMinutes / 60)}h`;

        timeouts.push(
          setTimeout(() => {
            new Notification(task.title, { body: label, tag: `task-${task.id}-${offsetMinutes}` });
          }, delay)
        );
      }
    }

    return () => timeouts.forEach(clearTimeout);
  }, [tasks]);

  return null;
}
