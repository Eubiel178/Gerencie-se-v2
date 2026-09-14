"use client";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Button, ConfirmIconButton, Input } from "@/components";

import { deleteReadingItemAction, updateReadingItemAction } from "@/features/reading/actions";
import { IReadingItem, ReadingStatus } from "@/features/reading/domain";

import styles from "../../reading.module.css";

const STATUS_OPTIONS = [
  { label: "Quero ler", value: "want_to_read" },
  { label: "Lendo", value: "reading" },
  { label: "Concluído", value: "finished" },
];

// Arrastar o slider de progresso dispara onChange várias vezes seguidas —
// sem isso, cada tick vira uma requisição, e uma resposta mais lenta podia
// chegar DEPOIS de uma mais nova e sobrescrever o valor com um progresso
// antigo. Debounce controla a rajada de requisições; o número de sequência
// garante que só a resposta da ÚLTIMA requisição em voo tem efeito.
const PROGRESS_DEBOUNCE_MS = 300;

export function Item({ item }: { item: IReadingItem }) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [localProgress, setLocalProgress] = useState(item.progressPercent);
  const [error, setError] = useState<string | null>(null);

  const progressRequestIdRef = useRef(0);
  const progressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    if (isSavingStatus) return;

    const status = event.target.value as ReadingStatus;
    const progressPercent = status === "finished" ? 100 : item.progressPercent;
    setLocalProgress(progressPercent);

    setIsSavingStatus(true);
    try {
      const result = await updateReadingItemAction({ id: item.id, status, progressPercent });
      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    } finally {
      setIsSavingStatus(false);
    }
  }

  function handleProgressChange(event: React.ChangeEvent<HTMLInputElement>) {
    const progressPercent = Number(event.target.value);
    setLocalProgress(progressPercent);

    if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current);

    progressDebounceRef.current = setTimeout(async () => {
      const requestId = ++progressRequestIdRef.current;

      const result = await updateReadingItemAction({
        id: item.id,
        status: progressPercent >= 100 ? "finished" : "reading",
        progressPercent,
      });

      // Uma requisição mais nova já foi disparada enquanto esta esperava —
      // aplicar essa resposta agora sobrescreveria um valor mais recente.
      if (requestId !== progressRequestIdRef.current) return;

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    }, PROGRESS_DEBOUNCE_MS);
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

        <ConfirmIconButton
          icon="FaTrash"
          ariaLabel={`Remover ${item.title}`}
          confirmText="Remover este item?"
          loading={isRemoving}
          onConfirm={handleRemove}
        />
      </div>

      <div className={styles.itemControls}>
        <Input.FieldSelect
          aria-label={`Status de leitura de ${item.title}`}
          value={item.status}
          disabled={isSavingStatus}
          onChange={handleStatusChange}
          optionsArray={STATUS_OPTIONS}
        />

        {item.status === "reading" && (
          <>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${localProgress}%` }} />
            </div>
            <p className={styles.progressPercent}>{localProgress}%</p>
            <input
              type="range"
              min={0}
              max={100}
              aria-label={`Progresso de leitura de ${item.title}`}
              value={localProgress}
              onChange={handleProgressChange}
            />
          </>
        )}
      </div>

      {error && <p className={styles.itemError}>{error}</p>}
    </li>
  );
}
