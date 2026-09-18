"use client";

import { useState } from "react";

import { Button, ConfirmIconButton, Input } from "@/components";
import { Icon } from "@/components/icon";
import { SharedBadge } from "@/features/connections/components/shared-badge";

import {
  createGoalStepAction,
  deleteGoalAction,
  deleteGoalStepAction,
  reorderGoalStepsAction,
  updateGoalStepAction,
} from "@/features/goals/actions";
import { EditGoal } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import { IGoal, calculateGoalProgress } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import { emitMascotEvent } from "@/features/mascot-pet";
import { useStepChecklist } from "@/hooks/use-step-checklist";
import { useGoalStore } from "@/features/goals/goal-store";

import styles from "./styles.module.css";

interface CardProps {
  goal: IGoal;
  connections: LoadAcceptedConnections.Model;
}

export function Card({ goal, connections }: CardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");
  const replaceGoal = useGoalStore((state) => state.replaceGoal);
  const removeGoal = useGoalStore((state) => state.removeGoal);

  const {
    newTitle: newStepTitle,
    setNewTitle: setNewStepTitle,
    isAdding: isAddingStep,
    busyStepId,
    handleAddStep: submitNewStep,
    handleToggleStep,
    handleRemoveStep,
  } = useStepChecklist({
    addStep: (title) => createGoalStepAction({ goalId: goal.id, title }),
    removeStep: (id) => deleteGoalStepAction({ id }),
    refreshAfterAction: false,
    onAdded: (title, id) => {
      if (!id) return;
      const steps = [...goal.steps, { id, goalId: goal.id, title, completed: false, order: goal.steps.length }];
      replaceGoal({ ...goal, steps, progressPercent: calculateGoalProgress(steps) });
    },
    onRemoved: (id) => {
      const steps = goal.steps.filter((step) => step.id !== id);
      replaceGoal({ ...goal, steps, progressPercent: calculateGoalProgress(steps) });
    },
    onToggled: (stepId, completed) => {
      const steps = goal.steps.map((step) => step.id === stepId ? { ...step, completed } : step);
      replaceGoal({ ...goal, steps, progressPercent: calculateGoalProgress(steps) });
    },
    toggleStep: async (stepId, completed) => {
      const result = await updateGoalStepAction({ id: stepId, completed });

      if (result.error) {
        emitMascotEvent("action-error");
      } else {
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
      }

      return result;
    },
  });

  async function handleRemoveGoal() {
    setIsRemoving(true);

    try {
      await deleteGoalAction({ id: goal.id });
      removeGoal(goal.id);
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleMoveStep(stepId: string, direction: -1 | 1) {
    if (isReordering) return;

    const currentIndex = goal.steps.findIndex((step) => step.id === stepId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= goal.steps.length) return;

    const orderedIds = goal.steps.map((step) => step.id);
    [orderedIds[currentIndex], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[currentIndex]];
    setIsReordering(true);
    try {
      const result = await reorderGoalStepsAction({ goalId: goal.id, orderedStepIds: orderedIds });
      if (!result.error) {
        const steps = orderedIds.map((id, order) => ({
          ...goal.steps.find((step) => step.id === id)!,
          order,
        }));
        replaceGoal({ ...goal, steps });
      }
    } finally {
      setIsReordering(false);
    }
  }

  async function handleSaveStepTitle(stepId: string) {
    const title = editingStepTitle.trim();
    if (!title) return;

    const result = await updateGoalStepAction({ id: stepId, title });
    if (!result.error) {
      setEditingStepId(null);
      setEditingStepTitle("");
      const steps = goal.steps.map((step) => step.id === stepId ? { ...step, title } : step);
      replaceGoal({ ...goal, steps });
    }
  }

  // `useStepChecklist.handleAddStep` não recebe evento - o form daqui
  // (diferente do de `TaskSteps`, que não é um <form> de verdade) precisa
  // impedir o recarregamento padrão do navegador antes de chamar ele.
  function handleAddStep(event: React.FormEvent) {
    event.preventDefault();
    submitNewStep();
  }

  return (
    <li className={styles.card} data-priority={goal.priority}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <h3 className={styles.cardTitle}>{goal.title}</h3>

          <div className={styles.meta}>
            <span className={`${styles.priorityBadge} ${styles[`priority${capitalize(goal.priority)}`]}`}>
              {PRIORITY_LABELS[goal.priority]}
            </span>

            {goal.deadline && (
              <span className={styles.deadline}>Prazo: {formatDeadline(goal.deadline)}</span>
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
        <p className={styles.progressHint}>
          {goal.steps.filter((step) => step.completed).length} de {goal.steps.length} etapas concluídas
          — progresso calculado automaticamente.
        </p>
      ) : (
        <p className={styles.progressHint}>
          Adicione etapas abaixo para o progresso ser calculado automaticamente.
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
