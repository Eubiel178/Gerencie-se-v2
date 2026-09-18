"use client";

import { useState } from "react";

import { Button, ConfirmIconButton, EmptyState } from "@/components";

import { deleteCycleEntryAction } from "@/features/menstrual-cycle/actions";
import { ICycleEntry } from "@/features/menstrual-cycle/domain";

import styles from "./styles.module.css";

export function History({ entries, onRemove }: { entries: ICycleEntry[]; onRemove: (id: string) => void }) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setRemovingId(id);

    try {
      const result = await deleteCycleEntryAction({ id });
      if (!result.error) onRemove(id);
    } finally {
      setRemovingId(null);
    }
  }

  if (entries.length === 0) {
    return <EmptyState>Seu histórico vai aparecer aqui depois do primeiro registro.</EmptyState>;
  }

  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.item}>
          <div className={styles.itemInfo}>
            <span className={styles.itemDate}>{formatDate(entry.startDate)}</span>
            <span className={styles.itemMeta}>
              {entry.periodLengthDays && `${entry.periodLengthDays} dias`}
              {entry.symptoms.length > 0 && ` · ${entry.symptoms.join(", ")}`}
            </span>
          </div>

          <ConfirmIconButton
            icon="FaTrash"
            ariaLabel="Remover registro"
            confirmText="Remover este registro?"
            loading={removingId === entry.id}
            onConfirm={() => handleDelete(entry.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
