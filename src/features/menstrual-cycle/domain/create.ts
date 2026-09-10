import { ICycleEntry } from "./cycle-entry";

export type CreateCycleEntry = {
  create: (params: CreateCycleEntry.Params) => Promise<{ id: string }>;
};

export namespace CreateCycleEntry {
  export type Params = Pick<ICycleEntry, "startDate" | "periodLengthDays" | "symptoms" | "notes">;
}
