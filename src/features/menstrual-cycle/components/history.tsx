"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash } from "react-icons/fa";

import { Button } from "@/components";

import { deleteCycleEntryAction } from "@/features/menstrual-cycle/actions";
import { ICycleEntry } from "@/features/menstrual-cycle/domain";

import styles from "../cycle.module.css";

export function History({ entries }: { entries: ICycleEntry[] }) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setRemovingId(id);

    try {
      await deleteCycleEntryAction({ id });
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  if (entries.length === 0) {
    return <p className={styles.emptyMessage}>Nenhum registro ainda.</p>;
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

          <Button
            color="danger"
            background="transparent"
            size="xlarge"
            aria-label="Remover registro"
            loading={removingId === entry.id}
            onClick={() => handleDelete(entry.id)}
          >
            <FaTrash />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
