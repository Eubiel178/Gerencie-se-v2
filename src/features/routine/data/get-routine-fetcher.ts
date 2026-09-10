import "server-only";

import { LocalRoutineItem } from "./local-routine";

// Única factory do repositório de rotina — usada tanto pelo Server
// Component da página quanto pelas Server Actions em `actions.ts`.
export function getRoutineFetcher() {
  return new LocalRoutineItem();
}
