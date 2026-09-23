import { IRoutineItem } from "./routine-item";

// Sem parâmetros: a listagem é sempre escopada pelo usuário da sessão
// autenticada (resolvida dentro da implementação), nunca por um id que o
// chamador poderia informar. Ordenada por horário (ver `LocalRoutineItem`).
export type LoadAllRoutineItems = {
  loadAll: () => Promise<LoadAllRoutineItems.Model>;
};

export namespace LoadAllRoutineItems {
  export type Model = IRoutineItem[];
}
