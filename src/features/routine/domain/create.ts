import { IRoutineItem } from "./routine-item";

export type CreateRoutineItem = {
  create: (params: CreateRoutineItem.Params) => Promise<{ id: string }>;
};

export namespace CreateRoutineItem {
  // "userId" nunca vem do chamador: resolvido no servidor a partir da
  // sessão autenticada dentro da implementação (ver `LocalRoutineItem`).
  export type Params = Omit<IRoutineItem, "id" | "userId" | "createdAt" | "isSharedWithMe" | "ownerLabel">;
}
