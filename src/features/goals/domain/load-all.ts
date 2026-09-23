import { IGoal } from "./goal";

// Sem parâmetros: a listagem é sempre escopada pelo usuário da sessão
// autenticada. Objetivos arquivados não entram na listagem padrão.
export type LoadAllGoals = {
  loadAll: () => Promise<LoadAllGoals.Model>;
};

export namespace LoadAllGoals {
  export type Model = IGoal[];
}
