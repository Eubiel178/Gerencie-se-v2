"use client";

import { ConfirmCheckbox, ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
import { StatusBadge } from "@/components/status-badge";
import { SharedBadge } from "@/features/connections/components/shared-badge";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { IGoal } from "@/features/goals/domain";
import { formatDateOnly } from "@/utils/date";

import { EditGoal } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import styles from "./styles.module.css";
import { useGoalMutations } from "./use-goal-card-actions";

interface CardProps {
  goal: IGoal;
  connections: LoadAcceptedConnections.Model;
}

export function Card({ goal, connections }: CardProps) {
  const {
    isRemoving,
    isTogglingCompletion,
    busyStepId,
    isCompleted,
    isCompletedBySteps,
    handleRemoveGoal,
    handleToggleManualCompletion,
    handleToggleStep,
  } = useGoalMutations(goal);

  return (
    <li className={styles.card} data-priority={goal.priority}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <div className={styles.titleLine}>
            <ConfirmCheckbox
              className={styles.completeCheckbox}
              checked={isCompleted}
              ariaLabel={`Marcar objetivo "${goal.title}" como ${isCompleted ? "não concluído" : "concluído"}`}
              confirmText={
                isCompleted
                  ? `Marcar o objetivo "${goal.title}" como não concluído?`
                  : `Concluir o objetivo "${goal.title}"?`
              }
              confirmLabel={isCompleted ? "Reabrir" : "Concluir"}
              loading={isTogglingCompletion}
              onConfirm={handleToggleManualCompletion}
            />
            <h3 className={styles.cardTitle}>{goal.title}</h3>
          </div>

          <div className={styles.meta}>
            <span
              className={`${styles.priorityBadge} ${styles[`priority${capitalize(goal.priority)}`]}`}
            >
              {PRIORITY_LABELS[goal.priority]}
            </span>

            {goal.deadline && (
              <span className={styles.deadline}>
                Prazo: {formatDateOnly(goal.deadline)}
              </span>
            )}

            {isCompleted && (
              <StatusBadge tone="completed">
                <Icon name="FaCheck" aria-hidden="true" size={10} /> Concluído
              </StatusBadge>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <EditGoal goalBeingEdited={goal} connections={connections} />

          {!goal.isSharedWithMe && (
            <ConfirmIconButton
              icon="FaTrash"
              ariaLabel={`Excluir objetivo "${goal.title}"`}
              confirmText={`Excluir "${goal.title}"?`}
              loading={isRemoving}
              onConfirm={handleRemoveGoal}
            />
          )}
        </div>
      </div>
      <SharedBadge
        isSharedWithMe={goal.isSharedWithMe}
        ownerLabel={goal.ownerLabel}
        isShared={!!goal.sharedWithUserId}
        className={styles.sharedBadge}
      />
      {goal.description && (
        <p className={styles.description}>{goal.description}</p>
      )}
      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${goal.progressPercent}%` }}
          />
        </div>
        <span className={styles.progressLabel}>{goal.progressPercent}%</span>
      </div>
      {goal.steps.length > 0 ? (
        <p className={styles.progressHint} aria-live="polite">
          {isCompletedBySteps
            ? "Objetivo concluído: todos os passos foram marcados."
            : isCompleted
              ? "Objetivo marcado como concluído."
              : `${goal.steps.filter((step) => step.completed).length} de ${goal.steps.length} passos concluídos.`}
        </p>
      ) : (
        <p className={styles.progressHint}>
          {isCompleted
            ? "Objetivo concluído."
            : "Marque como concluído quando atingir este objetivo."}
        </p>
      )}
      {goal.steps.length > 0 && (
        <ul className={styles.steps}>
          {goal.steps.map((step) => (
            <li key={step.id} className={styles.step}>
              <input
                type="checkbox"
                checked={step.completed}
                disabled={busyStepId === step.id}
                onChange={(event) =>
                  handleToggleStep(step.id, event.target.checked)
                }
                aria-label={step.title}
              />
              <span
                className={`${styles.stepTitle} ${step.completed ? styles.stepTitleDone : ""}`}
              >
                {step.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
