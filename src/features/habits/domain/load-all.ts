import { IHabit } from "./habit";

// Sem parâmetros: a listagem é sempre escopada pelo usuário da sessão
// autenticada. Hábitos arquivados não entram na listagem padrão.
export type LoadAllHabits = {
  loadAll: () => Promise<LoadAllHabits.Model>;
};

export namespace LoadAllHabits {
  export type Model = IHabit[];
}
