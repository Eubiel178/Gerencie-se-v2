import assert from "node:assert/strict";
import test from "node:test";

import { calculateMascotLevel, XP_PER_LEVEL } from "./mascot";

test("0 XP: nível 1, sem progresso no nível", () => {
  assert.deepEqual(calculateMascotLevel(0), {
    level: 1,
    xpIntoCurrentLevel: 0,
    xpForNextLevel: XP_PER_LEVEL,
  });
});

test("XP dentro do primeiro nível", () => {
  const result = calculateMascotLevel(35);
  assert.equal(result.level, 1);
  assert.equal(result.xpIntoCurrentLevel, 35);
});

test("XP exatamente no limite do nível avança para o próximo", () => {
  const result = calculateMascotLevel(XP_PER_LEVEL);
  assert.equal(result.level, 2);
  assert.equal(result.xpIntoCurrentLevel, 0);
});

test("XP alto avança vários níveis corretamente", () => {
  const result = calculateMascotLevel(XP_PER_LEVEL * 3 + 42);
  assert.equal(result.level, 4);
  assert.equal(result.xpIntoCurrentLevel, 42);
});

test("XP negativo (dado inconsistente) não gera nível ou resto negativo", () => {
  const result = calculateMascotLevel(-10);
  assert.equal(result.level, 1);
  assert.equal(result.xpIntoCurrentLevel, 0);
});
