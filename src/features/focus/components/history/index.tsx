import { IFocusSession } from "@/features/focus/domain";

import styles from "./history.module.css";

interface HistoryProps {
  sessions: IFocusSession[];
}

export function History({ sessions }: HistoryProps) {
  if (sessions.length === 0) {
    return <p className={styles.emptyMessage}>Nenhuma sessão de foco ainda — a primeira aparece aqui.</p>;
  }

  return (
    <ul className={styles.list}>
      {sessions.map((session) => (
        <li key={session.id} className={styles.item}>
          <span className={styles.date}>{formatDateTime(session.startedAt)}</span>

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

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}
