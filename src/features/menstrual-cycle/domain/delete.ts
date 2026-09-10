import { ICycleEntry } from "./cycle-entry";

export type DeleteCycleEntry = {
  delete: (params: DeleteCycleEntry.Params) => Promise<void>;
};

export namespace DeleteCycleEntry {
  export type Params = Pick<ICycleEntry, "id">;
}
