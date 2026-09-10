export type LogWater = {
  logWater: (params: LogWater.Params) => Promise<{ id: string }>;
};

export namespace LogWater {
  export type Params = { amountMl: number };
}

export type DeleteHydrationLog = {
  deleteLog: (params: DeleteHydrationLog.Params) => Promise<void>;
};

export namespace DeleteHydrationLog {
  export type Params = { id: string };
}
