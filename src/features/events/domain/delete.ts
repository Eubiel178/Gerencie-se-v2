import { IEvent } from "./event";

export type DeleteEvent = {
  delete: (params: DeleteEvent.Params) => Promise<void>;
};

export namespace DeleteEvent {
  export type Params = Pick<IEvent, "id">;
}
