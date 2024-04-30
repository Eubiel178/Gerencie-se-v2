import { ITask } from "./task";

export type CreateTask = {
  create: (params: CreateTask.Params) => Promise<any>;
};

export namespace CreateTask {
  export type Params = Omit<ITask, "id">;
}
