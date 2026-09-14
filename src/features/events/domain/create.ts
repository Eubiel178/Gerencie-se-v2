import { IEvent } from "./event";

export type CreateEvent = {
  create: (params: CreateEvent.Params) => Promise<CreateEvent.Result>;
};

export namespace CreateEvent {
  // "userId" nunca vem do chamador: é resolvido no servidor a partir da
  // sessão autenticada dentro da implementação (ver `LocalEvent`).
  export type Params = Omit<IEvent, "id" | "userId">;
  export type Result = Pick<IEvent, "id">;
}
