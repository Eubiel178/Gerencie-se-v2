import { ICycleEntry } from "./cycle-entry";
import { ICycleEstimate } from "./cycle-estimate";

export type LoadAllCycleEntries = {
  loadAll: () => Promise<LoadAllCycleEntries.Model>;
};

export namespace LoadAllCycleEntries {
  export type Model = {
    entries: ICycleEntry[];
    estimate: ICycleEstimate;
  };
}
