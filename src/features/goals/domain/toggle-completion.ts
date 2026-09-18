export type SetGoalCompletion = {
  setCompletion: (params: SetGoalCompletion.Params) => Promise<SetGoalCompletion.Result>;
};

export namespace SetGoalCompletion {
  export type Params = { id: string; completed: boolean };
  export type Result = { completedAt: Date | null; completionOverride: boolean };
}
