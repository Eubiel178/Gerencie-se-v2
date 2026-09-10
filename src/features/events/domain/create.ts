import { IEvent } from "./event";

export type CreateEvent = {
  create: (params: CreateEvent.Params) => Promise<any>;
};

export namespace CreateEvent {
  // "userId" nunca vem do chamador: é resolvido no servidor a partir da
  // sessão autenticada dentro da implementação (ver `LocalEvent`).
  export type Params = Omit<IEvent, "id" | "userId">;
}
