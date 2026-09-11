import assert from "node:assert/strict";
import test from "node:test";

import { filterHabits } from "./filter-habits";

function habit(overrides: Partial<Parameters<typeof filterHabits>[0][number]>) {
  return {
    id: "h1",
    userId: "u1",
    title: "Beber água",
    frequency: "daily" as const,
    archived: false,
    createdAt: new Date(),
    completedToday: false,
    currentStreak: 0,
    completionsThisWeek: 0,
    isSharedWithMe: false,
    ...overrides,
  };
}

test("filterHabits: busca por nome, case-insensitive", () => {
  const habits = [habit({ title: "Beber água" }), habit({ title: "Ler" })];
  const result = filterHabits(habits, { searchQuery: "ÁGUA", frequencyFilter: "all", statusFilter: "all" });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Beber água");
});

test("filterHabits: filtro de frequencia", () => {
  const habits = [habit({ frequency: "daily" }), habit({ frequency: "weekly" })];
  const result = filterHabits(habits, { searchQuery: "", frequencyFilter: "weekly", statusFilter: "all" });

  assert.equal(result.length, 1);
  assert.equal(result[0].frequency, "weekly");
});

test("filterHabits: filtro de status hoje", () => {
  const habits = [habit({ completedToday: true }), habit({ completedToday: false })];

  assert.equal(
    filterHabits(habits, { searchQuery: "", frequencyFilter: "all", statusFilter: "done-today" }).length,
    1
  );
  assert.equal(
    filterHabits(habits, { searchQuery: "", frequencyFilter: "all", statusFilter: "pending-today" }).length,
    1
  );
});
