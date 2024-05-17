import { ITask } from "./task";

export type LoadAllTasks = {
  loadAll: (params: LoadAllTasks.Params) => Promise<LoadAllTasks.Model>;
};

export namespace LoadAllTasks {
  export type Params = Pick<ITask, "id">;

  export type Model = ITask[];
}
