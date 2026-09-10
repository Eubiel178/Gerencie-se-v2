import { ITask } from "./task";

export type CreateTask = {
  create: (params: CreateTask.Params) => Promise<{ id: string }>;
};

export namespace CreateTask {
  // "userId" nunca vem do chamador: é resolvido no servidor a partir da
  // sessão autenticada dentro da implementação (ver `LocalTask`).
  //
  // "syncStatus" / "syncError" / "googleEventId" também não vêm do
  // chamador — são geridos internamente pela orquestração de sincronização
  // em `src/features/tasks/actions.ts` depois que o evento é (ou não)
  // criado no Google Agenda.
  export type Params = Omit<
    ITask,
    | "id"
    | "userId"
    | "syncStatus"
    | "syncError"
    | "googleEventId"
    | "googleEventUpdatedAt"
    | "completed"
    | "completedAt"
  >;
}
