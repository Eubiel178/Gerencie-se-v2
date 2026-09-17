"use client";

import { useSyncExternalStore } from "react";

import { EmptyState } from "@/components";
import { IFocusSession } from "@/features/focus/domain";
import { formatFocusSessionStartedAt } from "@/features/focus/format-focus-session-started-at";

import styles from "./styles.module.css";

function subscribeToTimeZone(): () => void {
  // Não há evento confiável para mudança de fuso no navegador. A leitura é
  // refeita após a hidratação por `useSyncExternalStore`; uma nova visita à
  // página cobre alterações posteriores do sistema operacional.
  return () => {};
}

function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

interface HistoryProps {
  sessions: IFocusSession[];
  /** Fuso IANA persistido para o usuário; o navegador o confirma após montar. */
  timeZone: string;
}

export function History({ sessions, timeZone }: HistoryProps) {
  // A preferência já torna a renderização inicial determinística. Para a
  // primeira visita (antes de `useCaptureTimezone` persistir a preferência),
  // o navegador corrige para seu próprio fuso depois de hidratar, sem depender
  // do fuso do processo Node.
  const displayTimeZone = useSyncExternalStore(subscribeToTimeZone, getBrowserTimeZone, () => timeZone);

  if (sessions.length === 0) {
    return <EmptyState>Seu histórico de foco vai aparecer aqui quando você concluir a primeira sessão.</EmptyState>;
  }

  return (
    <ul className={styles.list}>
      {sessions.map((session) => (
        <li key={session.id} className={styles.item}>
          <span className={styles.date}>{formatFocusSessionStartedAt(session.startedAt, displayTimeZone)}</span>

          {session.status === "cancelled" ? (
            <span className={styles.statusCancelled}>Cancelada</span>
          ) : (
            <>
              <span className={styles.duration}>
                {formatMinutes(session.actualDurationSeconds ?? 0)}
              </span>
              <span className={styles.xp}>+{session.xpEarned} XP</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}
