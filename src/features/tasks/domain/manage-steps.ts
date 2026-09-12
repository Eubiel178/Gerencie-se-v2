import { ITaskStep } from "./task-step";

export type CreateTaskStep = {
  createStep: (params: CreateTaskStep.Params) => Promise<{ id: string }>;
};

export namespace CreateTaskStep {
  export type Params = Pick<ITaskStep, "taskId" | "title">;
}

export type UpdateTaskStep = {
  updateStep: (params: UpdateTaskStep.Params) => Promise<void>;
};

export namespace UpdateTaskStep {
  export type Params = Pick<ITaskStep, "id" | "completed">;
}

export type DeleteTaskStep = {
  deleteStep: (params: DeleteTaskStep.Params) => Promise<void>;
};

export namespace DeleteTaskStep {
  export type Params = Pick<ITaskStep, "id">;
}
