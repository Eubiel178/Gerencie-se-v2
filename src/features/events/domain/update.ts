import { IEvent } from "./event";

export type UpdateEvent = {
  update: (params: UpdateEvent.Params) => Promise<void>;
};

export namespace UpdateEvent {
  // "userId" não é atualizável pelo chamador — a implementação usa o id da
  // sessão autenticada apenas para restringir o UPDATE ao dono do evento.
  export type Params = Omit<IEvent, "userId">;
}
