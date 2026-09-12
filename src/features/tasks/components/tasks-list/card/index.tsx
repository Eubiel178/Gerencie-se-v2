"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";

import {
  deleteTaskAction,
  markTaskStartedAction,
  retryTaskSyncAction,
  toggleTaskCompleteAction,
} from "@/features/tasks/actions";

import { Button } from "@/components";
import { SharedBadge } from "@/features/connections/components/shared-badge";
import { EditTask } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import { ITask } from "@/features/tasks/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import styles from "../../../home-dashboard.module.css";
import { useTaskStore } from "@/features/tasks/task-store";

const HIGH_PRIORITY_BADGE_CLASS = {
  critica: "priorityBadgeError",
  alta: "priorityBadgeWarning",
} as const;

interface CardProps {
  task: ITask;
  // Rótulo de exibição da tag (ex.: "#Estudo") — mantido separado de
  // `task.tag` (que continua sendo o valor real, ex.: "studie") para que o
  // formulário de edição sempre receba a tarefa original, nunca a versão
  // formatada só para exibição.
  tagLabel: string;
  isGoogleConnected: boolean;
  connections: LoadAcceptedConnections.Model;
}

export function Card({
  task,
  tagLabel,
  isGoogleConnected,
  connections,
}: CardProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const removeTask = useTaskStore((state) => state.removeTask);

  async function handleTaskRemove() {
    setIsRemoving(true);

    try {
      const result = await deleteTaskAction({ id: task.id });
      if (!result.error) removeTask(task.id);
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleToggleComplete() {
    setIsToggling(true);

    try {
      await toggleTaskCompleteAction({ id: task.id });
      router.refresh();
    } finally {
      setIsToggling(false);
    }
  }

  async function handleMarkStarted() {
    if (isStarting) return;
    setIsStarting(true);

    try {
      await markTaskStartedAction({ id: task.id });
      router.refresh();
    } finally {
      setIsStarting(false);
    }
  }

  async function handleRetrySync() {
    setIsRetrying(true);

    try {
      await retryTaskSyncAction({ id: task.id });
      router.refresh();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <li key={task.id} className={styles.taskCard}>
      <div className={styles.taskCardHeader}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.completeCheckbox}
              data-checked={task.completed}
              aria-pressed={task.completed}
              aria-label={`Marcar tarefa "${task.title}" como ${task.completed ? "não concluída" : "concluída"}`}
              disabled={isToggling}
              onClick={handleToggleComplete}
            >
              {task.completed && <Icon name="FaCheck" aria-hidden="true" />}
            </button>

            <p className={styles.tagLabel}>{tagLabel}</p>
          </div>

          <div className={styles.headerActions}>
            {!task.completed && !task.startedAt && (
              <Button.Preset
                icon={{ name: "FaPlay" }}
                root={{
                  tone: "highlight",
                  "aria-label": `Começar tarefa ${task.title}`,
                  loading: isStarting,
                  onClick: handleMarkStarted,
                }}
              />
            )}

            {!task.isSharedWithMe && (
              <Button.Preset
                icon={{ name: "FaTrash" }}
                root={{
                  tone: "danger",
                  "aria-label": `Excluir tarefa ${task.title}`,
                  loading: isRemoving,
                  onClick: handleTaskRemove,
                }}
              />
            )}

            <EditTask
              taskBeingEdited={task}
              isGoogleConnected={isGoogleConnected}
              connections={connections}
            />
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <h3 className={styles.taskTitle} data-completed={task.completed}>
                {task.title}
              </h3>

              {task.recurrence !== "none" && (
                <Icon
                  name="FaRedo"
                  role="img"
                  aria-label={
                    task.recurrence === "daily"
                      ? "Repete diariamente"
                      : "Repete semanalmente"
                  }
                  title={
                    task.recurrence === "daily"
                      ? "Repete diariamente"
                      : "Repete semanalmente"
                  }
                  size={12}
                  color="var(--color-text-muted)"
                />
              )}

              {task.startedAt && !task.completed && (
                <span className={styles.startedBadge}>
                  <Icon name="FaPlay" aria-hidden="true" size={10} />
                  Em andamento
                </span>
              )}
            </div>

            {(task.priority === "critica" || task.priority === "alta") && (
              <p className={styles[HIGH_PRIORITY_BADGE_CLASS[task.priority]]}>
                {PRIORITY_LABELS[task.priority]}
              </p>
            )}
          </div>

          <p className={styles.description}>{task.description}</p>

          <SharedBadge
            isSharedWithMe={task.isSharedWithMe}
            ownerLabel={task.ownerLabel}
            isShared={!!task.sharedWithUserId}
            label="Compartilhada"
            className={styles.sharedBadge}
          />
        </div>

        {task.syncEnabled && (
          <div className={styles.syncSection}>
            {task.syncStatus === "SYNCED" && (
              <p className={styles.syncSuccess}>
                Sincronizado com o Google Agenda
              </p>
            )}

            {task.syncStatus === "ERROR" && (
              <>
                <p className={styles.syncError}>
                  {task.syncError ||
                    "Falha ao sincronizar com o Google Agenda."}
                </p>

                <Button.Root
                  type="button"
                  className={styles.retryButton}
                  loading={isRetrying}
                  onClick={handleRetrySync}
                >
                  <span className={styles.retryButtonContent}>
                    <Icon name="FaSyncAlt" aria-hidden="true" />
                    <span>Tentar novamente</span>
                  </span>
                </Button.Root>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
