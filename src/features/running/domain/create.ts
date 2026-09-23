import { IRunningSession } from "./running-session";

export type CreateRunningSession = {
  create: (params: CreateRunningSession.Params) => Promise<IRunningSession>;
};

export namespace CreateRunningSession {
  export type Params = Pick<
    IRunningSession,
    "durationSeconds" | "distanceMeters" | "source"
  >;
}
