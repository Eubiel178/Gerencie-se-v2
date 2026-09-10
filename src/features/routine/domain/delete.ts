import { IRoutineItem } from "./routine-item";

export type DeleteRoutineItem = {
  delete: (params: DeleteRoutineItem.Params) => Promise<void>;
};

export namespace DeleteRoutineItem {
  export type Params = Pick<IRoutineItem, "id">;
}
