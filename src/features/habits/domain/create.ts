import { IHabit } from "./habit";

export type CreateHabit = {
  create: (params: CreateHabit.Params) => Promise<{ id: string }>;
};

export namespace CreateHabit {
  export type Params = Pick<IHabit, "title" | "frequency" | "targetPerWeek" | "goalId">;
}
