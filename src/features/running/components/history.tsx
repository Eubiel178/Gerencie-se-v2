"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash } from "react-icons/fa";

import { Button, Feedback } from "@/components";

import { deleteRunningSessionAction } from "@/features/running/actions";
import { IRunningSession } from "@/features/running/domain";

import styles from "../running.module.css";

interface HistoryProps {
  sessions: IRunningSession[];
}

export function History({ sessions }: HistoryProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setRemovingId(id);

    try {
      await deleteRunningSessionAction({ id });
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  if (sessions.length === 0) {
    return <Feedback>Nenhuma corrida registrada ainda.</Feedback>;
  }

  return (
    <ul className={styles.list}>
      {sessions.map((session) => (
        <li key={session.id} className={styles.item}>
          <div className={styles.itemStats}>
            <span className={styles.itemDate}>{formatDate(session.startedAt)}</span>
            <span className={styles.itemMain}>
              {(session.distanceMeters / 1000).toFixed(2)} km em{" "}
              {Math.round(session.durationSeconds / 60)} min
              {session.paceMinPerKm !== null && ` · ${session.paceMinPerKm.toFixed(1)} min/km`}
            </span>
            <span className={styles.sourceTag}>
              {session.source === "gps" ? "GPS" : "Manual"}
            </span>
          </div>

          <Button
            color="danger"
            background="transparent"
            size="xlarge"
            aria-label="Excluir corrida"
            loading={removingId === session.id}
            onClick={() => handleDelete(session.id)}
          >
            <FaTrash />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}
