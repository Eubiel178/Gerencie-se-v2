import { IGoal } from "./goal";

export type DeleteGoal = {
  delete: (params: DeleteGoal.Params) => Promise<void>;
};

export namespace DeleteGoal {
  export type Params = Pick<IGoal, "id">;
}
