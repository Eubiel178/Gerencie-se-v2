import { TaskWorkStatus } from "./task";

export type SetTaskWorkStatus = {
  setWorkStatus: (params: SetTaskWorkStatus.Params) => Promise<void>;
};

export namespace SetTaskWorkStatus {
  export type Params = { id: string; workStatus: TaskWorkStatus };
}
