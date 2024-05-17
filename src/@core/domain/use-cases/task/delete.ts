import { ITask } from "./task";

export type DeleteTask = {
  delete: (params: DeleteTask.Params) => Promise<void>;
};

export namespace DeleteTask {
  export type Params = Pick<ITask, "id">;
}
