"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";

import {
  deleteTaskAction,
  markTaskStartedAction,
  setTaskWorkStatusAction,
  retryTaskSyncAction,
  toggleTaskCompleteAction,
  updateTaskStepAction,
} from "@/features/tasks/actions";

import { Button, ConfirmIconButton } from "@/components";
import { SharedBadge } from "@/features/connections/components/shared-badge";
import { EditTask } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import { ITask } from "@/features/tasks/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import styles from "./styles.module.css";
import { useTaskStore } from "@/features/tasks/task-store";
import { emitMascotEvent } from "@/features/mascot-pet";
import { useFocusSession } from "@/features/focus/focus-session-context";
import { useExecutionCompanionStore } from "@/features/execution-companion";

function formatDeadline(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayLabel =
    day.getTime() === startOfToday.getTime()
      ? "Hoje"
      : day.getTime() === startOfTomorrow.getTime()
        ? "Amanhã"
        : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
            .format(date)
            .replace(".", "");
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dayLabel} · até ${time}`;
}

function formatRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}min`
    : `${minutes} min`;
}

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
  const [isUpdatingWorkStatus, setIsUpdatingWorkStatus] = useState(false);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const removeTask = useTaskStore((state) => state.removeTask);
  const replaceTask = useTaskStore((state) => state.replaceTask);
  const { session: focusSession, remaining } = useFocusSession();
  const isFocused = focusSession?.taskId === task.id;
  const executionSession = useExecutionCompanionStore((s) => s.session);
  const isExecuting = executionSession?.taskId === task.id && executionSession.status === "active";
  const workStatus =
    task.workStatus ?? (task.startedAt ? "in_progress" : "pending");

  async function handleTaskRemove() {
    setIsRemoving(true);

    try {
      const result = await deleteTaskAction({ id: task.id });
      if (!result.error) removeTask(task.id);
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleToggleComplete() {
    setIsToggling(true);

    try {
      const result = await toggleTaskCompleteAction({ id: task.id });
      if (result.error) {
        emitMascotEvent("action-error");
      } else if (result.completed) {
        emitMascotEvent("task-completed");
      }
      if (!result.error)
        replaceTask({
          ...task,
          completed: !!result.completed,
          completedAt: result.completed ? new Date() : null,
        });
    } finally {
      setIsToggling(false);
    }
  }

  async function handleMarkStarted() {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const result = await markTaskStartedAction({ id: task.id });
      if (!result.error)
        replaceTask({ ...task, startedAt: task.startedAt ?? new Date() });
    } finally {
      setIsStarting(false);
    }
  }

  async function handleWorkStatus(
    nextStatus: "pending" | "in_progress" | "paused",
  ) {
    if (isUpdatingWorkStatus) return;
    setIsUpdatingWorkStatus(true);

    try {
      const result = await setTaskWorkStatusAction({
        id: task.id,
        workStatus: nextStatus,
      });
      if (!result.error) replaceTask({ ...task, workStatus: nextStatus });
    } finally {
      setIsUpdatingWorkStatus(false);
    }
  }

  async function handleRetrySync() {
    setIsRetrying(true);

    try {
      const result = await retryTaskSyncAction({ id: task.id });
      if (!result.error && result.task) replaceTask(result.task);
    } finally {
      setIsRetrying(false);
    }
  }

  async function handleToggleStep(stepId: string, completed: boolean) {
    if (busyStepId) return;
    setBusyStepId(stepId);
    try {
      const result = await updateTaskStepAction({ id: stepId, completed });
      if (!result.error) {
        replaceTask({
          ...task,
          steps: task.steps.map((step) =>
            step.id === stepId ? { ...step, completed } : step,
          ),
        });
      }
    } finally {
      setBusyStepId(null);
    }
  }

  return (
    <li key={task.id} className={styles.taskCard} data-priority={task.priority}>
      <div className={styles.taskCardHeader}>
        <div className={styles.cardTitleGroup}>
          <div className={styles.titleLine}>
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

            <h3 className={styles.taskTitle} data-completed={task.completed}>
              {task.title}
            </h3>
          </div>

          <div className={styles.meta}>
            <span className={styles.priorityBadge}>
              {PRIORITY_LABELS[task.priority]}
            </span>

            <span className={styles.tagLabel}>{tagLabel}</span>

            {task.scheduledAt && (
              <span className={styles.deadline}>
                <Icon name="FaCalendarAlt" aria-hidden="true" size={12} />
                {formatDeadline(task.scheduledAt)}
              </span>
            )}

            {task.recurrence !== "none" && (
              <span className={styles.recurrenceBadge}>
                <Icon name="FaRedo" aria-hidden="true" size={11} />
                {task.recurrence === "daily" ? "Diária" : "Semanal"}
              </span>
            )}

            {(task.attachmentCount ?? 0) > 0 && (
              <span className={styles.attachmentBadge}>
                <Icon name="FaPaperclip" aria-hidden="true" size={11} />
                {task.attachmentCount}{" "}
                {task.attachmentCount === 1 ? "anexo" : "anexos"}
              </span>
            )}

            {task.completed && (
              <span className={styles.completedBadge}>
                <Icon name="FaCheck" aria-hidden="true" size={10} /> Concluída
              </span>
            )}
            {workStatus === "in_progress" && !task.completed && (
              <span className={styles.startedBadge}>
                <Icon name="FaPlay" aria-hidden="true" size={10} />
                Em andamento
              </span>
            )}
            {workStatus === "paused" && !task.completed && (
              <span className={styles.pausedBadge}>
                <Icon name="FaPause" aria-hidden="true" size={10} /> Pausada
              </span>
            )}
            {isExecuting && (
              <span className={styles.startedBadge}>
                <Icon name="FaPlay" aria-hidden="true" size={10} />
                Fazendo agora
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <details className={styles.overflowMenu}>
            <summary aria-label={`Mais ações para ${task.title}`}>
              <Icon name="FaEllipsisV" aria-hidden="true" />
            </summary>
            <div className={styles.overflowMenuContent}>
              <EditTask
                taskBeingEdited={task}
                isGoogleConnected={isGoogleConnected}
                connections={connections}
              />
              {!task.isSharedWithMe && (
                <ConfirmIconButton
                  icon="FaTrash"
                  ariaLabel={`Excluir tarefa ${task.title}`}
                  confirmText="Excluir esta tarefa?"
                  loading={isRemoving}
                  onConfirm={handleTaskRemove}
                />
              )}
            </div>
          </details>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          {task.description && (
            <p className={styles.description}>{task.description}</p>
          )}

          {task.steps.length > 0 && (
            <div className={styles.stepsProgress}>
              <p className={styles.stepsSummary} aria-live="polite">
                <Icon name="FaListUl" aria-hidden="true" size={11} />
                {task.steps.filter((step) => step.completed).length} de{" "}
                {task.steps.length} passos concluídos
              </p>
              <ul className={styles.stepsPreview} aria-label="Passos da tarefa">
                {task.steps.map((step) => (
                  <li key={step.id} data-completed={step.completed}>
                    <input
                      type="checkbox"
                      checked={step.completed}
                      disabled={busyStepId === step.id}
                      onChange={(event) =>
                        handleToggleStep(step.id, event.target.checked)
                      }
                      aria-label={`Concluir passo: ${step.title}`}
                    />
                    {step.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SharedBadge
            isSharedWithMe={task.isSharedWithMe}
            ownerLabel={task.ownerLabel}
            isShared={!!task.sharedWithUserId}
            label="Compartilhada"
            className={styles.sharedBadge}
          />

          {isFocused && (
            <p className={styles.focusState}>
              <Icon name="MdTimer" aria-hidden="true" /> Em foco ·{" "}
              {formatRemaining(remaining)} restantes
            </p>
          )}
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

        {!task.completed && (
          <div className={styles.primaryActions}>
            {workStatus === "pending" && (
              <Button.Root
                type="button"
                loading={isStarting}
                onClick={handleMarkStarted}
              >
                <Icon name="FaPlay" aria-hidden="true" /> Começar
              </Button.Root>
            )}

            {workStatus === "in_progress" && !isFocused && (
              <Button.Root
                type="button"
                variant="secondary"
                loading={isUpdatingWorkStatus}
                onClick={() => handleWorkStatus("paused")}
              >
                <Icon name="FaPause" aria-hidden="true" /> Pausar
              </Button.Root>
            )}

            {workStatus === "paused" && (
              <Button.Root
                type="button"
                loading={isUpdatingWorkStatus}
                onClick={() => handleWorkStatus("in_progress")}
              >
                <Icon name="FaPlay" aria-hidden="true" /> Retomar
              </Button.Root>
            )}

            <Button.Root
              type="button"
              variant="secondary"
              onClick={() => router.push(`/home/focus?taskId=${task.id}`)}
            >
              <Icon name="MdTimer" aria-hidden="true" />{" "}
              {isFocused ? "Abrir foco" : "Focar"}
            </Button.Root>
          </div>
        )}
      </div>
    </li>
  );
}
