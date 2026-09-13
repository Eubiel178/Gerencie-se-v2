"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components";
import { Icon } from "@/components/icon";
import { ITaskAttachment } from "@/features/tasks/domain";
import {
  ALLOWED_ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_SIZE_BYTES,
  formatFileSize,
  isFileTooLarge,
} from "@/lib/upload-limits";

import styles from "./attachments-field.module.css";

type PendingStatus = "uploading" | "too-large" | "error";

interface PendingFile {
  id: string;
  file: File;
  status: PendingStatus;
  error?: string;
}

interface AttachmentsFieldProps {
  taskId: string;
}

/**
 * Anexos de uma tarefa já existente — upload direto pro Route Handler
 * (`/api/tasks/[taskId]/attachments`), fora do fluxo de submit do
 * formulário de edição (que é uma Server Action separada). Cada arquivo
 * é validado contra `MAX_ATTACHMENT_SIZE_BYTES` no momento da seleção —
 * um arquivo grande demais nunca chega a entrar na fila de envio.
 */
export function AttachmentsField({ taskId }: AttachmentsFieldProps) {
  const inputId = useId();
  const [attachments, setAttachments] = useState<ITaskAttachment[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAttachments() {
      try {
        const response = await fetch(`/api/tasks/${taskId}/attachments`);
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setListError(data.error ?? "Não foi possível carregar os anexos.");
          return;
        }

        setAttachments(data.attachments);
      } catch {
        if (!cancelled) setListError("Não foi possível carregar os anexos.");
      }
    }

    loadAttachments();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function uploadFile(entry: PendingFile) {
    const formData = new FormData();
    formData.append("file", entry.file);

    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        setPending((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, status: "error", error: data.error as string } : item
          )
        );
        return;
      }

      setAttachments((current) => [...(current ?? []), data.attachment as ITaskAttachment]);
      setPending((current) => current.filter((item) => item.id !== entry.id));
    } catch {
      setPending((current) =>
        current.map((item) =>
          item.id === entry.id ? { ...item, status: "error", error: "Falha de conexão." } : item
        )
      );
    }
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const entries: PendingFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: isFileTooLarge(file.size) ? "too-large" : "uploading",
    }));

    setPending((current) => [...current, ...entries]);

    for (const entry of entries) {
      if (entry.status === "uploading") uploadFile(entry);
    }
  }

  function handleDismissPending(id: string) {
    setPending((current) => current.filter((item) => item.id !== id));
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);

    try {
      await fetch(`/api/tasks/${taskId}/attachments/${id}`, { method: "DELETE" });
      setAttachments((current) => (current ?? []).filter((item) => item.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const hasItems = (attachments?.length ?? 0) > 0 || pending.length > 0;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.pickerLabel}>
        <Icon name="FaPaperclip" size={14} />
        Anexar arquivo
        <span className={styles.hint}>até {formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)} por arquivo</span>
      </label>

      <input
        id={inputId}
        type="file"
        multiple
        accept={ALLOWED_ATTACHMENT_ACCEPT}
        className={styles.hiddenInput}
        onChange={(event) => {
          handleFilesSelected(event.target.files);
          event.target.value = "";
        }}
      />

      {listError && <p className={styles.error}>{listError}</p>}

      {hasItems && (
        <ul className={styles.list}>
          {attachments?.map((attachment) => (
            <li key={attachment.id} className={styles.item}>
              <a
                href={`/api/tasks/${taskId}/attachments/${attachment.id}`}
                className={styles.fileLink}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="FaPaperclip" size={12} />
                {attachment.fileName}
              </a>

              <span className={styles.size}>{formatFileSize(attachment.sizeBytes)}</span>

              <Button.Preset
                icon={{ name: "FaTrash" }}
                root={{
                  tone: "danger",
                  "aria-label": `Remover ${attachment.fileName}`,
                  loading: deletingId === attachment.id,
                  onClick: () => handleDelete(attachment.id),
                }}
              />
            </li>
          ))}

          {pending.map((entry) => (
            <li key={entry.id} className={styles.item} data-status={entry.status}>
              <span className={styles.fileLink}>
                <Icon
                  name={entry.status === "uploading" ? "FaSpinner" : "FaExclamationTriangle"}
                  size={12}
                  className={entry.status === "uploading" ? styles.spinningIcon : undefined}
                />
                {entry.file.name}
              </span>

              <span className={styles.size}>{formatFileSize(entry.file.size)}</span>

              <span className={styles.statusText}>
                {entry.status === "uploading" && "Enviando…"}
                {entry.status === "too-large" &&
                  `Arquivo muito grande — máximo ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}`}
                {entry.status === "error" && (entry.error ?? "Falha ao enviar")}
              </span>

              {entry.status !== "uploading" && (
                <Button.Preset
                  icon={{ name: "FaTimes" }}
                  root={{ "aria-label": "Descartar", onClick: () => handleDismissPending(entry.id) }}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {!hasItems && !listError && <p className={styles.emptyHint}>Nenhum anexo ainda.</p>}
    </div>
  );
}
