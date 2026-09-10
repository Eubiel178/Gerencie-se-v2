import { ITask } from "./task";

// Sem parâmetros: a listagem é sempre escopada pelo usuário da sessão
// autenticada (resolvida dentro da implementação), nunca por um id que o
// chamador poderia informar.
export type LoadAllTasks = {
  loadAll: () => Promise<LoadAllTasks.Model>;
};

export namespace LoadAllTasks {
  export type Model = ITask[];
}
