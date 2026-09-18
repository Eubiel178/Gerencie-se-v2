import assert from "node:assert/strict";
import test from "node:test";

import { useGoalStore } from "./goal-store";

const goal = {
  id: "goal-1",
  userId: "user-1",
  title: "Planejar a viagem",
  description: "",
  priority: "media" as const,
  archived: false,
  createdAt: new Date("2026-09-18T12:00:00.000Z"),
  steps: [],
  progressPercent: 0,
  isSharedWithMe: false,
};

test("adiciona um objetivo novo no início do estado compartilhado", () => {
  useGoalStore.getState().setGoals([]);
  useGoalStore.getState().addGoal(goal);

  assert.deepEqual(useGoalStore.getState().goals, [goal]);
});
