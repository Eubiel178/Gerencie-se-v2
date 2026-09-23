import assert from "node:assert/strict";
import test from "node:test";

import { calculateGoalProgress } from "./progress";

test("sem etapas: progresso é 0 (não divide por zero)", () => {
  assert.equal(calculateGoalProgress([]), 0);
});

test("nenhuma etapa concluída: 0%", () => {
  assert.equal(calculateGoalProgress([{ completed: false }, { completed: false }]), 0);
});

test("todas as etapas concluídas: 100%", () => {
  assert.equal(calculateGoalProgress([{ completed: true }, { completed: true }]), 100);
});

test("progresso parcial é arredondado", () => {
  // 1 de 3 = 33.33...% -> arredonda para 33
  const steps = [{ completed: true }, { completed: false }, { completed: false }];
  assert.equal(calculateGoalProgress(steps), 33);
});

test("2 de 3 concluídas arredonda para 67%", () => {
  const steps = [{ completed: true }, { completed: true }, { completed: false }];
  assert.equal(calculateGoalProgress(steps), 67);
});
