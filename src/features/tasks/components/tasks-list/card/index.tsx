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
import { useExecutionCompanionStore, useExecutionCompanion } from "@/features/execution-companion";

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
        ? "Amanha"
        : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
            .format(date)
            .replace(".", "");
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dayLabel}, ate ${time}`;
}

function isOverdue(value: string): boolean {
  return new Date(value) < new Date();
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
  const [showSteps, setShowSteps] = useState(false);
  const removeTask = useTaskStore((state) => state.removeTask);
  const replaceTask = useTaskStore((state) => state.replaceTask);
  const { session: focusSession, remaining } = useFocusSession();
  const isFocused = focusSession?.taskId === task.id;
  const executionSession = useExecutionCompanionStore((s) => s.session);
  const { pauseSession, resumeSession } = useExecutionCompanion();
  const isExecuting =
    executionSession?.taskId === task.id && executionSession.status === "active";
  const workStatus =
    task.workStatus ?? (task.startedAt ? "in_progress" : "pending");

  const completedSteps = task.steps.filter((s) => s.completed).length;
  const totalSteps = task.steps.length;
  const stepsPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

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
      if (!result.error) {
        replaceTask({ ...task, workStatus: nextStatus });

        if (executionSession?.taskId === task.id) {
          if (nextStatus === "paused") {
            await pauseSession();
          } else if (nextStatus === "in_progress") {
            await resumeSession();
          }
        }
      }
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

  const showPrimaryActions = !task.completed;
  const hasSyncIssue =
    task.syncEnabled && task.syncStatus === "ERROR";
  const hasSyncSuccess =
    task.syncEnabled && task.syncStatus === "SYNCED";

  return (
    <li key={task.id} className={styles.taskCard} data-priority={task.priority}>
      {/* Header: checkbox + titulo + menu */}
      <div className={styles.taskCardHeader}>
        <div className={styles.cardTitleGroup}>
          <div className={styles.titleLine}>
            <button
              type="button"
              className={styles.completeCheckbox}
              data-checked={task.completed}
              aria-pressed={task.completed}
              aria-label={`Marcar tarefa "${task.title}" como ${task.completed ? "nao concluida" : "concluida"}`}
              disabled={isToggling}
              onClick={handleToggleComplete}
            >
              {task.completed && <Icon name="FaCheck" aria-hidden="true" />}
            </button>

            <h3 className={styles.taskTitle} data-completed={task.completed}>
              {task.title}
            </h3>
          </div>

          {/* Metadados compactos - linha unica */}
          <div className={styles.meta}>
            <span className={styles.priorityText}>
              {PRIORITY_LABELS[task.priority]}
            </span>

            <span className={styles.metaGroup}>
              <span className={styles.metaSep} aria-hidden="true">·</span>
              <span className={styles.tagLabel}>{tagLabel}</span>
            </span>

            {task.scheduledAt && (
              <span className={styles.metaGroup}>
                <span className={styles.metaSep} aria-hidden="true">·</span>
                <span
                  className={styles.deadline}
                  data-overdue={isOverdue(task.scheduledAt) && !task.completed}
                >
                  {formatDeadline(task.scheduledAt)}
                </span>
              </span>
            )}

            {task.recurrence !== "none" && (
              <span className={styles.metaGroup}>
                <span className={styles.metaSep} aria-hidden="true">·</span>
                <span className={styles.recurrenceInfo}>
                  {task.recurrence === "daily" ? "Diaria" : "Semanal"}
                </span>
              </span>
            )}

            {(task.attachmentCount ?? 0) > 0 && (
              <span className={styles.metaGroup}>
                <span className={styles.metaSep} aria-hidden="true">·</span>
                <span
                  className={styles.attachmentInfo}
                  aria-label={`${task.attachmentCount} ${task.attachmentCount === 1 ? "anexo" : "anexos"}`}
                >
                  <Icon name="FaPaperclip" aria-hidden="true" size={10} />
                  {task.attachmentCount}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <details className={styles.overflowMenu}>
            <summary aria-label={`Mais acoes para ${task.title}`}>
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
        {/* Status row */}
        <div className={styles.statusRow}>
          {isExecuting && (
            <span className={styles.statusExecuting}>
              <span className={styles.pulse} aria-hidden="true" />
              Fazendo agora
            </span>
          )}

          {!isExecuting && workStatus === "in_progress" && !task.completed && (
            <span className={styles.statusInProgress}>
              <Icon name="FaPlay" aria-hidden="true" size={10} />
              Em andamento
            </span>
          )}

          {!isExecuting && workStatus === "paused" && !task.completed && (
            <span className={styles.statusPaused}>
              <Icon name="FaPause" aria-hidden="true" size={10} /> Pausada
            </span>
          )}

          {task.completed && (
            <span className={styles.statusCompleted}>
              <Icon name="FaCheck" aria-hidden="true" size={10} /> Concluida
            </span>
          )}

          {isFocused && (
            <span className={styles.focusIndicator}>
              <Icon name="MdTimer" aria-hidden="true" size={11} /> Em foco ·{" "}
              {formatRemaining(remaining)}
            </span>
          )}
        </div>

        {/* Descricao — estilo secundario, line-clamp */}
        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}

        {/* Progresso */}
        {totalSteps > 0 && (
          <div className={styles.stepsCompact}>
            <div className={styles.stepsCompactSummary}>
              <span>
                {completedSteps} de {totalSteps} passos
              </span>
              <button
                type="button"
                onClick={() => setShowSteps((prev) => !prev)}
                aria-expanded={showSteps}
              >
                {showSteps ? "Ocultar passos" : "Ver passos"}
              </button>
            </div>
            <div
              className={styles.stepsBar}
              role="progressbar"
              aria-valuenow={completedSteps}
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-label={`${completedSteps} de ${totalSteps} passos concluidos`}
            >
              <div
                className={styles.stepsBarFill}
                style={{ width: `${stepsPercent}%` }}
              />
            </div>

            {showSteps && (
              <ul className={styles.stepsExpanded} aria-label="Passos da tarefa">
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
            )}
          </div>
        )}

        <SharedBadge
          isSharedWithMe={task.isSharedWithMe}
          ownerLabel={task.ownerLabel}
          isShared={!!task.sharedWithUserId}
          label="Compartilhada"
          className={styles.sharedBadge}
        />

        {/* Sincronizacao */}
        {hasSyncSuccess && (
          <p className={styles.syncSuccess}>
            Sincronizado com o Google Agenda
          </p>
        )}

        {hasSyncIssue && (
          <div className={styles.syncSection}>
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
          </div>
        )}

        {/* Acoes */}
        {showPrimaryActions && (
          <div className={styles.cardActions}>
            {workStatus === "pending" && (
              <Button.Root
                type="button"
                loading={isStarting}
                className={styles.actionPrimary}
                onClick={handleMarkStarted}
              >
                <Icon name="FaPlay" aria-hidden="true" /> Comecar
              </Button.Root>
            )}

            {workStatus === "in_progress" && !isFocused && (
              <Button.Root
                type="button"
                loading={isUpdatingWorkStatus}
                className={styles.actionPrimary}
                onClick={() => handleWorkStatus("paused")}
              >
                <Icon name="FaPause" aria-hidden="true" /> Pausar
              </Button.Root>
            )}

            {workStatus === "paused" && (
              <Button.Root
                type="button"
                loading={isUpdatingWorkStatus}
                className={styles.actionPrimary}
                onClick={() => handleWorkStatus("in_progress")}
              >
                <Icon name="FaPlay" aria-hidden="true" /> Retomar
              </Button.Root>
            )}

            <Button.Root
              type="button"
              variant="secondary"
              className={styles.actionSecondary}
              onClick={() => router.push(`/home/focus?taskId=${task.id}`)}
            >
              <Icon name="MdTimer" aria-hidden="true" />{" "}
              {isFocused ? "Abrir foco" : "Focar nesta tarefa"}
            </Button.Root>
          </div>
        )}
      </div>
    </li>
  );
}
