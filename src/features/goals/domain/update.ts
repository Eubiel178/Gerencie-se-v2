import { IGoal } from "./goal";

export type UpdateGoal = {
  update: (params: UpdateGoal.Params) => Promise<void>;
};

export namespace UpdateGoal {
  export type Params = Pick<
    IGoal,
    "id" | "title" | "description" | "deadline" | "priority"
  >;
}
