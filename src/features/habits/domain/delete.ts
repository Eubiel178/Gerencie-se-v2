import { IHabit } from "./habit";

export type DeleteHabit = {
  delete: (params: DeleteHabit.Params) => Promise<void>;
};

export namespace DeleteHabit {
  export type Params = Pick<IHabit, "id">;
}
