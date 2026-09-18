import { IGoalStep } from "./goal-step";

export type CreateGoalStep = {
  createStep: (params: CreateGoalStep.Params) => Promise<{ id: string }>;
};

export namespace CreateGoalStep {
  export type Params = Pick<IGoalStep, "goalId" | "title">;
}

export type UpdateGoalStep = {
  updateStep: (params: UpdateGoalStep.Params) => Promise<void>;
};

export namespace UpdateGoalStep {
  export type Params = Pick<IGoalStep, "id"> &
    Partial<Pick<IGoalStep, "completed" | "title">>;
}

export type DeleteGoalStep = {
  deleteStep: (params: DeleteGoalStep.Params) => Promise<void>;
};

export namespace DeleteGoalStep {
  export type Params = Pick<IGoalStep, "id">;
}

export type ReorderGoalSteps = {
  reorderSteps: (params: ReorderGoalSteps.Params) => Promise<void>;
};

export namespace ReorderGoalSteps {
  export type Params = { goalId: string; orderedStepIds: string[] };
}
