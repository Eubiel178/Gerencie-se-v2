import { IEvent } from "./event";

// Sem parâmetros: a listagem é sempre escopada pelo usuário da sessão
// autenticada (resolvida dentro da implementação), nunca por um id que o
// chamador poderia informar.
export type LoadAllEvents = {
  loadAll: () => Promise<LoadAllEvents.Model>;
};

export namespace LoadAllEvents {
  export type Model = IEvent[];
}
