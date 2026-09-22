"use client";

import { useState } from "react";

import {
  deleteGoalAction,
  setGoalCompletionAction,
  updateGoalStepAction,
} from "@/features/goals/actions";
import { calculateGoalProgress, IGoal } from "@/features/goals/domain";
import { useGoalStore } from "@/features/goals/goal-store";
import { emitMascotEvent } from "@/features/mascot-pet";

import { deriveGoalDisplayStatus } from "./derive-goal-display-status";

type ActiveAction = "removing" | "togglingCompletion" | null;

/**
 * Mesmo padrão de `useTaskMutations` (Tarefas): toda mutação/estado de
 * carregamento do card mora aqui, o componente `Card` fica só com JSX e
 * valores já derivados - antes, `handleRemoveGoal`/
 * `handleToggleManualCompletion`/`handleToggleStep` viviam soltos dentro
 * do próprio `Card`, misturando lógica de negócio com renderização.
 */
export function useGoalMutations(goal: IGoal) {
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const replaceGoal = useGoalStore((state) => state.replaceGoal);
  const removeGoal = useGoalStore((state) => state.removeGoal);

  const isCompletedBySteps = goal.steps.length > 0 && goal.progressPercent === 100;
  const displayStatus = deriveGoalDisplayStatus({
    completionOverride: goal.completionOverride,
    progressPercent: goal.progressPercent,
    hasSteps: goal.steps.length > 0,
  });
  const isCompleted = displayStatus === "completed";

  async function handleRemoveGoal() {
    setActiveAction("removing");
    try {
      const result = await deleteGoalAction({ id: goal.id });
      if (result.error) {
        emitMascotEvent("action-error");
      } else {
        removeGoal(goal.id);
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleToggleManualCompletion() {
    setActiveAction("togglingCompletion");
    try {
      const result = await setGoalCompletionAction({
        id: goal.id,
        completed: !isCompleted,
      });
      if (result.error) {
        emitMascotEvent("action-error");
      } else {
        if (!isCompleted) emitMascotEvent("goal-completed");
        replaceGoal({
          ...goal,
          completedAt: result.completedAt ?? null,
          completionOverride: result.completionOverride ?? null,
        });
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleToggleStep(stepId: string, completed: boolean) {
    if (busyStepId) return;
    setBusyStepId(stepId);
    try {
      const result = await updateGoalStepAction({ id: stepId, completed });
      if (result.error) {
        emitMascotEvent("action-error");
        return;
      }

      // Progresso é sempre calculado (nunca guardado - ver progress.ts),
      // então prevemos aqui o valor pós-toggle com os mesmos dados já
      // carregados, sem esperar o `router.refresh()` pra saber se acabou
      // de bater 100%.
      const stepsAfterToggle = goal.steps.map((step) =>
        step.id === stepId ? { ...step, completed } : step,
      );
      const progressAfterToggle = calculateGoalProgress(stepsAfterToggle);
      const wasCompleted = isCompleted;
      const isNowComplete = deriveGoalDisplayStatus({
        completionOverride: goal.completionOverride,
        progressPercent: progressAfterToggle,
        hasSteps: stepsAfterToggle.length > 0,
      }) === "completed";

      if (isNowComplete && !wasCompleted) emitMascotEvent("goal-completed");

      replaceGoal({
        ...goal,
        steps: stepsAfterToggle,
        progressPercent: progressAfterToggle,
        ...(isNowComplete ? { completionOverride: null, completedAt: null } : {}),
      });
    } finally {
      setBusyStepId(null);
    }
  }

  return {
    isRemoving: activeAction === "removing",
    isTogglingCompletion: activeAction === "togglingCompletion",
    busyStepId,
    displayStatus,
    isCompleted,
    isCompletedBySteps,
    handleRemoveGoal,
    handleToggleManualCompletion,
    handleToggleStep,
  };
}
