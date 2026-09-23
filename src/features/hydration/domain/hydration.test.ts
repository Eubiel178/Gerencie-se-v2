import assert from "node:assert/strict";
import test from "node:test";

import { calculateHydrationGoalPercent } from "./hydration";

test("calculateHydrationGoalPercent: metade da meta é 50%", () => {
  assert.equal(calculateHydrationGoalPercent({ totalMl: 1000, goalMl: 2000 }), 50);
});

test("calculateHydrationGoalPercent: beber além da meta trava em 100%", () => {
  assert.equal(calculateHydrationGoalPercent({ totalMl: 3000, goalMl: 2000 }), 100);
});

test("calculateHydrationGoalPercent: meta inválida (0) retorna 0 (sem divisão por zero)", () => {
  assert.equal(calculateHydrationGoalPercent({ totalMl: 500, goalMl: 0 }), 0);
});
