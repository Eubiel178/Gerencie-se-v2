import "server-only";

import { LocalGoal } from "./local-goal";

// Única factory do repositório de objetivos — usada tanto pelo Server
// Component da página quanto pelas Server Actions em `actions.ts`.
export function getGoalFetcher() {
  return new LocalGoal();
}
