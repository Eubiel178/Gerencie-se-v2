import { IGoal } from "./goal";

export type CreateGoal = {
  create: (params: CreateGoal.Params) => Promise<{ id: string }>;
};

export namespace CreateGoal {
  export type Params = Pick<IGoal, "title" | "description" | "deadline" | "priority">;
}
