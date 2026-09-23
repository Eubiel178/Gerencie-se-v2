"use client";

import { StepsEditor } from "@/components/steps-editor";
import type { IGoalStep } from "@/features/goals/domain";

type GoalStepsDraft = import("@/components/steps-editor/types").StepsDraft<IGoalStep>;

export type { GoalStepsDraft };

export type GoalStepsProps = {
  steps: IGoalStep[];
  onDraftChange: (draft: GoalStepsDraft) => void;
};

export function GoalSteps({ steps, onDraftChange }: GoalStepsProps) {
  return <StepsEditor steps={steps} onDraftChange={onDraftChange} />;
}
