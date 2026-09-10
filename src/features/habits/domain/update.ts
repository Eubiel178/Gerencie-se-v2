import { IHabit } from "./habit";

export type UpdateHabit = {
  update: (params: UpdateHabit.Params) => Promise<void>;
};

export namespace UpdateHabit {
  export type Params = Pick<
    IHabit,
    "id" | "title" | "frequency" | "targetPerWeek" | "goalId"
  >;
}
