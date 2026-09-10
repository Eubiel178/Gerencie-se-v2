import "server-only";

import { LocalHabit } from "./local-habit";

// Única factory do repositório de hábitos — usada tanto pelo Server
// Component da página quanto pelas Server Actions em `actions.ts`.
export function getHabitFetcher() {
  return new LocalHabit();
}
