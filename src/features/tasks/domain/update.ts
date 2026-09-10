import { ITask } from "./task";

export type UpdateTask = {
  update: (params: UpdateTask.Params) => Promise<void>;
};

export namespace UpdateTask {
  // "userId" não é atualizável pelo chamador — a implementação usa o id da
  // sessão autenticada apenas para restringir o UPDATE ao dono da tarefa.
  //
  // "syncStatus" / "syncError" / "googleEventId" também não são
  // atualizáveis por aqui — são geridos internamente pela orquestração de
  // sincronização (ver `create.ts` para o mesmo raciocínio).
  export type Params = Omit<
    ITask,
    | "userId"
    | "syncStatus"
    | "syncError"
    | "googleEventId"
    | "googleEventUpdatedAt"
    | "completed"
    | "completedAt"
    | "isSharedWithMe"
    | "ownerLabel"
  >;
}
