import { ITask } from "./task";

// Alterna concluído/não concluído — idempotente por design, mesmo padrão
// usado em `ToggleHabitLog` (features/habits): marcar/desmarcar é sempre
// a mesma ação, nunca aceita um "completed: true/false" explícito do
// chamador.
export type ToggleTaskComplete = {
  toggleComplete: (params: ToggleTaskComplete.Params) => Promise<ToggleTaskComplete.Result>;
};

export namespace ToggleTaskComplete {
  export type Params = Pick<ITask, "id">;
  export type Result = { completed: boolean };
}
