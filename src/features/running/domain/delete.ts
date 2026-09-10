import { IRunningSession } from "./running-session";

export type DeleteRunningSession = {
  delete: (params: DeleteRunningSession.Params) => Promise<void>;
};

export namespace DeleteRunningSession {
  export type Params = Pick<IRunningSession, "id">;
}
