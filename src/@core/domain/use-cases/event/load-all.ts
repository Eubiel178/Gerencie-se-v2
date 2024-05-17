import { IEvent } from "./event";

export type LoadAllEvents = {
  loadAll: (params: LoadAllEvents.Params) => Promise<LoadAllEvents.Model>;
};

export namespace LoadAllEvents {
  export type Params = Pick<IEvent, "id">;

  export type Model = IEvent[];
}
