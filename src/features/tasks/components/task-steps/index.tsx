"use client";

import { StepsEditor } from "@/components/steps-editor";
import type { ITaskStep } from "@/features/tasks/domain";

type TaskStepsDraft = import("@/components/steps-editor/types").StepsDraft<ITaskStep>;

export type { TaskStepsDraft };

export type TaskStepsProps = {
  steps: ITaskStep[];
  onDraftChange: (draft: TaskStepsDraft) => void;
};

export function TaskSteps({ steps, onDraftChange }: TaskStepsProps) {
  return <StepsEditor steps={steps} onDraftChange={onDraftChange} />;
}
