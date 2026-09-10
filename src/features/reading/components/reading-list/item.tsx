"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash } from "react-icons/fa";

import { Button, Input, Feedback } from "@/components";

import { deleteReadingItemAction, updateReadingItemAction } from "@/features/reading/actions";
import { IReadingItem, ReadingStatus } from "@/features/reading/domain";

import styles from "../../reading.module.css";

const STATUS_OPTIONS = [
  { label: "Quero ler", value: "want_to_read" },
  { label: "Lendo", value: "reading" },
  { label: "Concluído", value: "finished" },
];

export function Item({ item }: { item: IReadingItem }) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const status = event.target.value as ReadingStatus;
    const progressPercent = status === "finished" ? 100 : item.progressPercent;

    await updateReadingItemAction({ id: item.id, status, progressPercent });
    router.refresh();
  }

  async function handleProgressChange(event: React.ChangeEvent<HTMLInputElement>) {
    const progressPercent = Number(event.target.value);

    await updateReadingItemAction({
      id: item.id,
      status: progressPercent >= 100 ? "finished" : "reading",
      progressPercent,
    });
    router.refresh();
  }

  async function handleRemove() {
    setIsRemoving(true);

    try {
      await deleteReadingItemAction({ id: item.id });
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <li className={styles.item}>
      <div className={styles.itemHeader}>
        <div>
          <p className={styles.itemTitle}>{item.title}</p>
          {item.author && <p className={styles.itemAuthor}>{item.author}</p>}
        </div>

        <Button
          color="danger"
          background="transparent"
          size="xlarge"
          aria-label={`Remover ${item.title}`}
          loading={isRemoving}
          onClick={handleRemove}
        >
          <FaTrash />
        </Button>
      </div>

      <div className={styles.itemControls}>
        <Input.FieldSelect
          value={item.status}
          onChange={handleStatusChange}
          optionsArray={STATUS_OPTIONS}
        />

        {item.status === "reading" && (
          <>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${item.progressPercent}%` }} />
            </div>
            <Feedback size="small">{item.progressPercent}%</Feedback>
            <input
              type="range"
              min={0}
              max={100}
              value={item.progressPercent}
              onChange={handleProgressChange}
            />
          </>
        )}
      </div>
    </li>
  );
}
