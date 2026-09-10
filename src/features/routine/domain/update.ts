import { IRoutineItem } from "./routine-item";

export type UpdateRoutineItem = {
  update: (params: UpdateRoutineItem.Params) => Promise<void>;
};

export namespace UpdateRoutineItem {
  export type Params = Omit<IRoutineItem, "userId" | "createdAt">;
}
