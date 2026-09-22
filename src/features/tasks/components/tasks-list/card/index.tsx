"use client";

import { useState } from "react";

import { Button, ConfirmCheckbox, ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
import { SharedBadge } from "@/features/connections/components/shared-badge";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { ITask } from "@/features/tasks/domain";
import { formatTemporalContext } from "@/utils/date";

import { EditTask } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import {
  formatDeadline,
  isOverdue,
  formatRemaining,
  formatElapsed,
  formatElapsedSince,
} from "./deadline-helpers";
import { deriveDisplayStatus } from "./derive-display-status";
import styles from "./styles.module.css";
import { usePulseOnChange } from "./use-pulse-on-change";
import { useTaskMutations } from "./use-task-card-actions";
import { useTaskSyncRetry } from "./use-task-sync-retry";

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
  const {
    router,
    isRemoving,
    isToggling,
    isStarting,
    isUpdatingWorkStatus,
    busyStepId,
    focusSession,
    remaining,
    isExecuting,
    executingElapsedSeconds,
    handleTaskRemove,
    handleToggleComplete,
    handleMarkStarted,
    handleWorkStatus,
    handleToggleStep,
  } = useTaskMutations(task);
  const { isRetrying, handleRetrySync } = useTaskSyncRetry(task);

  const isFocused = focusSession?.taskId === task.id;
  const workStatus =
    task.workStatus ?? (task.startedAt ? "in_progress" : "pending");

  const displayStatus = deriveDisplayStatus({
    completed: task.completed,
    workStatus,
    isExecuting,
  });
  const statusPulsing = usePulseOnChange(displayStatus);
  const primaryActionPulsing = usePulseOnChange(workStatus);

  const completedSteps = task.steps.filter((s) => s.completed).length;
  const totalSteps = task.steps.length;
  const stepsPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const [showSteps, setShowSteps] = useState(false);

  const showPrimaryActions = !task.completed;
  const hasSyncIssue = task.syncEnabled && task.syncStatus === "ERROR";
  const hasSyncSuccess = task.syncEnabled && task.syncStatus === "SYNCED";

  return (
    <li key={task.id} className={styles.taskCard} data-priority={task.priority}>
      {/* Header: checkbox + menu */}
      <div className={styles.taskCardHeader}>
        <ConfirmCheckbox
          className={styles.completeCheckbox}
          checked={task.completed}
          ariaLabel={`Marcar tarefa "${task.title}" como ${task.completed ? "não concluída" : "concluída"}`}
          confirmText={
            task.completed
              ? `Marcar a tarefa "${task.title}" como não concluída?`
              : `Concluir a tarefa "${task.title}"?`
          }
          confirmLabel={task.completed ? "Reabrir" : "Concluir"}
          loading={isToggling}
          onConfirm={handleToggleComplete}
        />

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
                  ariaLabel={`Excluir tarefa "${task.title}"`}
                  confirmText={`Excluir "${task.title}"?`}
                  loading={isRemoving}
                  onConfirm={handleTaskRemove}
                />
              )}
            </div>
          </details>
        </div>
      </div>

      {/* Metadados — acima do titulo */}
      <div className={styles.meta}>
        <span className={styles.priorityText}>
          {PRIORITY_LABELS[task.priority]}
        </span>

        <span className={styles.metaGroup}>
          <span className={styles.metaSep} aria-hidden="true">
            ·
          </span>
          <span className={styles.tagLabel}>{tagLabel}</span>
        </span>

        {task.scheduledAt && (
          <span className={styles.metaGroup}>
            <span className={styles.metaSep} aria-hidden="true">
              ·
            </span>
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
            <span className={styles.metaSep} aria-hidden="true">
              ·
            </span>
            <span className={styles.recurrenceInfo}>
              {task.recurrence === "daily" ? "Diaria" : "Semanal"}
            </span>
          </span>
        )}

        {(task.attachmentCount ?? 0) > 0 && (
          <span className={styles.metaGroup}>
            <span className={styles.metaSep} aria-hidden="true">
              ·
            </span>
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

      {/* Titulo — abaixo dos metadados */}
      <h3 className={styles.taskTitle} data-completed={task.completed}>
        {task.title}
      </h3>

      <div className={styles.cardBody}>
        {/* Status row */}
        <div className={styles.statusRow}>
          {(() => {
            const configs: Record<
              typeof displayStatus,
              {
                label: string;
                context: string | null;
                icon: "FaPlay" | "FaPause" | "FaCheck";
                variant: string;
              }
            > = {
              idle: {
                label: "",
                context: null,
                icon: "FaPlay",
                variant: "executing",
              },
              executing: {
                label: "Fazendo agora",
                context: formatElapsed(executingElapsedSeconds),
                icon: "FaPlay" as const,
                variant: "executing",
              },
              paused: {
                label: "Pausada",
                // `task.pausedAt` (não `executionSession?.pausedAt`) -
                // o cliente só rastreia UMA sessão de execução por vez
                // (a ativa/pausada mais recente); uma tarefa pausada há
                // mais tempo, que não é mais essa sessão, perdia o "há
                // quanto tempo" ou mostrava o horário de OUTRA tarefa
                // (achado relatado: "perdi a data que foi pausada").
                // `pausedAt` mora na própria task por isso, mesmo
                // raciocínio de `completedAt` abaixo.
                //
                // `formatElapsedSince` (curto, "há 12 min") em vez de
                // `formatTemporalContext` (longo, "Hoje às 14:32") -
                // MESMO formato/tamanho que "Fazendo agora" usa
                // (`formatElapsed`). Formatos de tamanho bem diferentes
                // entre os dois estados faziam a linha de status quebrar
                // (ou parar de quebrar) ao alternar, e o card inteiro
                // "crescia e encolhia" a cada pausar/retomar (achado
                // relatado).
                context: task.pausedAt ? formatElapsedSince(task.pausedAt) : null,
                icon: "FaPause" as const,
                variant: "paused",
              },
              completed: {
                label: "Concluída",
                context: formatTemporalContext(task.completedAt),
                icon: "FaCheck" as const,
                variant: "completed",
              },
            };
            const s = configs[displayStatus] ?? configs.executing;
            return (
              <div
                className={styles.statusBadge}
                data-status={s.variant}
                data-hidden={displayStatus === "idle" ? "" : undefined}
                data-has-context={s.context ? "" : undefined}
                // Pulso breve só quando o status MUDA DE VERDADE (nunca no
                // primeiro render, nunca a cada segundo que
                // `executingElapsedSeconds` tica - ver `usePulseOnChange`).
                // Sem remontar o elemento (diferente da tentativa anterior
                // com `key`): remontar dava a impressão de conteúdo
                // "pulando" entre cards vizinhos, porque todo card monta
                // pela primeira vez ao mesmo tempo quando a lista carrega.
                data-pulse={statusPulsing ? "" : undefined}
              >
                <span className={styles.statusIcon}>
                  {s.variant === "executing" && (
                    <span className={styles.pulse} aria-hidden="true" />
                  )}
                  <Icon name={s.icon} aria-hidden="true" size={10} />
                </span>
                <span className={styles.statusLabel}>{s.label}</span>
                <span className={styles.statusSep} aria-hidden="true">
                  ·
                </span>
                <span className={styles.statusContext}>
                  {s.context ?? "\u200B"}
                </span>
              </div>
            );
          })()}

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
              aria-label={`${completedSteps} de ${totalSteps} passos concluídos`}
            >
              <div
                className={styles.stepsBarFill}
                style={{ width: `${stepsPercent}%` }}
              />
            </div>

            {showSteps && (
              <ul
                className={styles.stepsExpanded}
                aria-label="Passos da tarefa"
              >
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
          <p className={styles.syncSuccess}>Sincronizado com o Google Agenda</p>
        )}

        {hasSyncIssue && (
          <div className={styles.syncSection}>
            <p className={styles.syncError}>
              {task.syncError || "Falha ao sincronizar com o Google Agenda."}
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
      </div>

      {/* Footer */}
      {showPrimaryActions && (
        <div className={styles.cardFooter}>
          {workStatus === "pending" && (
            <Button.Root
              type="button"
              loading={isStarting}
              className={styles.actionPrimary}
              data-pulse={primaryActionPulsing ? "" : undefined}
              onClick={handleMarkStarted}
            >
              <Icon name="FaPlay" aria-hidden="true" /> Começar
            </Button.Root>
          )}

          {workStatus === "in_progress" && !isFocused && (
            <Button.Root
              type="button"
              loading={isUpdatingWorkStatus}
              className={styles.actionPrimary}
              data-pulse={primaryActionPulsing ? "" : undefined}
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
              data-pulse={primaryActionPulsing ? "" : undefined}
              onClick={() => handleWorkStatus("in_progress")}
            >
              <Icon name="FaPlay" aria-hidden="true" /> Retomar
            </Button.Root>
          )}

          <Button.Root
            type="button"
            variant="ghost"
            className={styles.actionSecondary}
            onClick={() => router.push(`/home/focus?taskId=${task.id}`)}
          >
            <Icon name="MdTimer" aria-hidden="true" />{" "}
            {isFocused ? "Abrir foco" : "Focar"}
          </Button.Root>
        </div>
      )}
    </li>
  );
}
