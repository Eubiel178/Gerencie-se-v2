import { IEvent } from "./event";

export type DeleteEvent = {
  delete: (params: DeleteEvent.Params) => Promise<any>;
};

export namespace DeleteEvent {
  export type Params = Pick<IEvent, "id">;
}
