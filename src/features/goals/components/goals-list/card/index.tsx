"use client";

import { useState } from "react";

import { ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
import { SharedBadge } from "@/features/connections/components/shared-badge";

import {
  deleteGoalAction,
  toggleGoalCompletionAction,
  updateGoalStepAction,
} from "@/features/goals/actions";
import { EditGoal } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import { IGoal, calculateGoalProgress } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import { emitMascotEvent } from "@/features/mascot-pet";
import { useGoalStore } from "@/features/goals/goal-store";

import styles from "./styles.module.css";

interface CardProps {
  goal: IGoal;
  connections: LoadAcceptedConnections.Model;
}

export function Card({ goal, connections }: CardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const replaceGoal = useGoalStore((state) => state.replaceGoal);
  const removeGoal = useGoalStore((state) => state.removeGoal);

  async function handleToggleStep(stepId: string, completed: boolean) {
    setBusyStepId(stepId);
    try {
      const result = await updateGoalStepAction({ id: stepId, completed });
      if (!result.error) {
        // Progresso é sempre calculado (nunca guardado - ver progress.ts),
        // então prevemos aqui o valor pós-toggle com os mesmos dados já
        // carregados, sem esperar o `router.refresh()` pra saber se
        // acabou de bater 100%.
        const stepsAfterToggle = goal.steps.map((step) =>
          step.id === stepId ? { ...step, completed } : step
        );
        const wasComplete = goal.progressPercent >= 100;
        const isNowComplete = calculateGoalProgress(stepsAfterToggle) >= 100;
        if (isNowComplete && !wasComplete) emitMascotEvent("goal-completed");
        const steps = goal.steps.map((step) => step.id === stepId ? { ...step, completed } : step);
        replaceGoal({ ...goal, steps, progressPercent: calculateGoalProgress(steps) });
      }
    } finally { setBusyStepId(null); }
  }

  async function handleRemoveGoal() {
    setIsRemoving(true);

    try {
      await deleteGoalAction({ id: goal.id });
      removeGoal(goal.id);
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleToggleManualCompletion() {
    setIsTogglingCompletion(true);
    try {
      const result = await toggleGoalCompletionAction({ id: goal.id });
      if (!result.error) {
        replaceGoal({ ...goal, completedAt: result.completedAt ?? null });
      }
    } finally {
      setIsTogglingCompletion(false);
    }
  }

  const isManuallyCompleted = goal.completedAt !== null && goal.completedAt !== undefined;
  const isCompletedBySteps = goal.steps.length > 0 && goal.progressPercent === 100;
  const isCompleted = isManuallyCompleted || isCompletedBySteps;

  return (
    <li className={styles.card} data-priority={goal.priority}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <div className={styles.titleLine}>
            <button
              type="button"
              className={styles.completeCheckbox}
              data-checked={isCompleted}
              aria-pressed={isCompleted}
              aria-label={`Marcar objetivo \"${goal.title}\" como ${isCompleted ? "não concluído" : "concluído"}`}
              disabled={isTogglingCompletion}
              onClick={handleToggleManualCompletion}
            >
              {isCompleted && <Icon name="FaCheck" aria-hidden="true" />}
            </button>
            <h3 className={styles.cardTitle}>{goal.title}</h3>
          </div>

          <div className={styles.meta}>
            <span className={`${styles.priorityBadge} ${styles[`priority${capitalize(goal.priority)}`]}`}>
              {PRIORITY_LABELS[goal.priority]}
            </span>

            {goal.deadline && (
              <span className={styles.deadline}>Prazo: {formatDeadline(goal.deadline)}</span>
            )}

            {isCompleted && (
              <span className={styles.completedBadge}>
                <Icon name="FaCheck" aria-hidden="true" size={10} /> Concluído
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <EditGoal goalBeingEdited={goal} connections={connections} />

          {!goal.isSharedWithMe && (
            <ConfirmIconButton
              icon="FaTrash"
              ariaLabel={`Excluir objetivo ${goal.title}`}
              confirmText="Excluir este objetivo?"
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

      {goal.description && <p className={styles.description}>{goal.description}</p>}

      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${goal.progressPercent}%` }} />
        </div>
        <span className={styles.progressLabel}>{goal.progressPercent}%</span>
      </div>

      {goal.steps.length > 0 ? (
        <p className={styles.progressHint} aria-live="polite">
          {isCompletedBySteps
            ? "Objetivo concluído: todos os passos foram marcados."
            : `${goal.steps.filter((step) => step.completed).length} de ${goal.steps.length} passos concluídos. Marque todos para concluir o objetivo.`}
        </p>
      ) : (
        <p className={styles.progressHint}>
          {isManuallyCompleted
            ? "Objetivo concluído."
            : "Sem passos. Marque o círculo ao lado do título quando concluir."}
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
                onChange={(event) => handleToggleStep(step.id, event.target.checked)}
                aria-label={step.title}
              />
              <span className={`${styles.stepTitle} ${step.completed ? styles.stepTitleDone : ""}`}>
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

function formatDeadline(deadline: string) {
  const [year, month, day] = deadline.split("-");
  return `${day}/${month}/${year}`;
}
