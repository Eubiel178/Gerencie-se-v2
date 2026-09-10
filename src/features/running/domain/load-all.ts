import { IRunningSession, IRunningTotals } from "./running-session";

export type LoadAllRunningSessions = {
  loadAll: () => Promise<LoadAllRunningSessions.Model>;
};

export namespace LoadAllRunningSessions {
  export type Model = {
    sessions: IRunningSession[];
    totals: IRunningTotals;
  };
}
