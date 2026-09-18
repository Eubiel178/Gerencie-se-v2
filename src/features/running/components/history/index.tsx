"use client";

import { useState } from "react";

import { Button, ConfirmIconButton, EmptyState } from "@/components";

import { deleteRunningSessionAction } from "@/features/running/actions";
import { IRunningSession } from "@/features/running/domain";

import styles from "./styles.module.css";

interface HistoryProps {
  sessions: IRunningSession[];
  onRemove: (id: string) => void;
}

export function History({ sessions, onRemove }: HistoryProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setRemovingId(id);

    try {
      const result = await deleteRunningSessionAction({ id });
      if (!result.error) onRemove(id);
    } finally {
      setRemovingId(null);
    }
  }

  if (sessions.length === 0) {
    return <EmptyState>Seu histórico de corridas vai aparecer aqui depois do primeiro registro.</EmptyState>;
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

          <ConfirmIconButton
            icon="FaTrash"
            ariaLabel="Excluir corrida"
            confirmText="Excluir esta corrida?"
            loading={removingId === session.id}
            onConfirm={() => handleDelete(session.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}
