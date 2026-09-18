export type ToggleGoalCompletion = {
  toggleCompletion: (params: ToggleGoalCompletion.Params) => Promise<ToggleGoalCompletion.Result>;
};

export namespace ToggleGoalCompletion {
  export type Params = { id: string };
  export type Result = { completed: boolean; completedAt: Date | null };
}
