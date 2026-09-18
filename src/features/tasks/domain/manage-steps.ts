import { ITaskStep } from "./task-step";

export type CreateTaskStep = {
  createStep: (params: CreateTaskStep.Params) => Promise<{ id: string }>;
};

export namespace CreateTaskStep {
  export type Params = Pick<ITaskStep, "taskId" | "title">;
}

export type CreateTaskSteps = {
  createSteps: (params: CreateTaskSteps.Params) => Promise<{ ids: string[] }>;
};

export namespace CreateTaskSteps {
  export type Params = { taskId: string; titles: string[] };
}

export type UpdateTaskStep = {
  updateStep: (params: UpdateTaskStep.Params) => Promise<void>;
};

export namespace UpdateTaskStep {
  /**
   * Um passo pode ser ajustado sem obrigar o cliente a reenviar os outros
   * campos. Ao menos uma das propriedades editáveis deve ser enviada pela
   * action que chama este caso de uso.
   */
  export type Params = Pick<ITaskStep, "id"> &
    Partial<Pick<ITaskStep, "completed" | "title">>;
}

export type DeleteTaskStep = {
  deleteStep: (params: DeleteTaskStep.Params) => Promise<void>;
};

export namespace DeleteTaskStep {
  export type Params = Pick<ITaskStep, "id">;
}

export type ReorderTaskSteps = {
  reorderSteps: (params: ReorderTaskSteps.Params) => Promise<void>;
};

export namespace ReorderTaskSteps {
  export type Params = { taskId: string; orderedStepIds: string[] };
}
