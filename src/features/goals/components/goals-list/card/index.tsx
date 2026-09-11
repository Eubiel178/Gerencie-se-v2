"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Input } from "@/components";
import { SharedBadge } from "@/features/connections/components/shared-badge";

import {
  createGoalStepAction,
  deleteGoalAction,
  deleteGoalStepAction,
  updateGoalStepAction,
} from "@/features/goals/actions";
import { EditGoal } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import { IGoal } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import styles from "../../../goals.module.css";

interface CardProps {
  goal: IGoal;
  connections: LoadAcceptedConnections.Model;
}

export function Card({ goal, connections }: CardProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [isAddingStep, setIsAddingStep] = useState(false);

  async function handleRemoveGoal() {
    setIsRemoving(true);

    try {
      await deleteGoalAction({ id: goal.id });
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleToggleStep(stepId: string, completed: boolean) {
    await updateGoalStepAction({ id: stepId, completed });
    router.refresh();
  }

  async function handleRemoveStep(stepId: string) {
    await deleteGoalStepAction({ id: stepId });
    router.refresh();
  }

  async function handleAddStep(event: React.FormEvent) {
    event.preventDefault();

    const title = newStepTitle.trim();
    if (!title) return;

    setIsAddingStep(true);

    try {
      await createGoalStepAction({ goalId: goal.id, title });
      setNewStepTitle("");
      router.refresh();
    } finally {
      setIsAddingStep(false);
    }
  }

  return (
    <li className={styles.card}>
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
            <Button.IconButtonPreset
              icon={{ name: "FaTrash" }}
              root={{
                tone: "danger",
                "aria-label": `Excluir objetivo ${goal.title}`,
                loading: isRemoving,
                onClick: handleRemoveGoal,
              }}
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

      {goal.steps.length > 0 && (
        <ul className={styles.steps}>
          {goal.steps.map((step) => (
            <li key={step.id} className={styles.step}>
              <input
                type="checkbox"
                checked={step.completed}
                onChange={(event) => handleToggleStep(step.id, event.target.checked)}
                aria-label={step.title}
              />
              <span className={`${styles.stepTitle} ${step.completed ? styles.stepTitleDone : ""}`}>
                {step.title}
              </span>
              <Button.IconButtonPreset
                icon={{ name: "FaTrash" }}
                root={{
                  tone: "danger",
                  className: styles.smallButton,
                  "aria-label": `Remover etapa ${step.title}`,
                  onClick: () => handleRemoveStep(step.id),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <form className={styles.addStepForm} onSubmit={handleAddStep}>
        <Input.Field
          aria-label="Título da nova etapa"
          placeholder="Nova etapa..."
          value={newStepTitle}
          onChange={(event) => setNewStepTitle(event.target.value)}
        />
        <Button.Root
          type="submit"
          variant="secondary"
          className={styles.smallButton}
          aria-label="Adicionar etapa"
          loading={isAddingStep}
        >
          <Button.Icon name="FaPlus" />
        </Button.Root>
      </form>
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
