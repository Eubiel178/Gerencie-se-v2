import { IEvent } from "./event";

export type CreateEvent = {
  create: (params: CreateEvent.Params) => Promise<any>;
};

export namespace CreateEvent {
  export type Params = Omit<IEvent, "id">;
}
