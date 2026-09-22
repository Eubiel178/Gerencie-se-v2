import assert from "node:assert/strict";
import test from "node:test";

import { deriveGoalDisplayStatus } from "./derive-goal-display-status";

test("deriveGoalDisplayStatus: sem passos e sem override fica pending, mesmo com progresso 100", () => {
  assert.equal(
    deriveGoalDisplayStatus({ completionOverride: null, progressPercent: 100, hasSteps: false }),
    "pending"
  );
});

test("deriveGoalDisplayStatus: todos os passos concluidos (progresso 100) marca completed", () => {
  assert.equal(
    deriveGoalDisplayStatus({ completionOverride: null, progressPercent: 100, hasSteps: true }),
    "completed"
  );
});

test("deriveGoalDisplayStatus: progresso parcial fica pending", () => {
  assert.equal(
    deriveGoalDisplayStatus({ completionOverride: null, progressPercent: 40, hasSteps: true }),
    "pending"
  );
});

test("deriveGoalDisplayStatus: completionOverride manual vence o progresso pelos passos", () => {
  assert.equal(
    deriveGoalDisplayStatus({ completionOverride: true, progressPercent: 0, hasSteps: true }),
    "completed"
  );
  assert.equal(
    deriveGoalDisplayStatus({ completionOverride: false, progressPercent: 100, hasSteps: true }),
    "pending"
  );
});

test("deriveGoalDisplayStatus: completionOverride undefined se comporta igual a null (segue o progresso)", () => {
  assert.equal(
    deriveGoalDisplayStatus({ completionOverride: undefined, progressPercent: 100, hasSteps: true }),
    "completed"
  );
});
