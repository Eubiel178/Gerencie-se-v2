import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";

import { computeCheckupDueState } from "./due-date";

test("sem lastDoneAt: sem próxima data, nunca atrasado", () => {
  assert.deepEqual(computeCheckupDueState(null, 90), { nextDueDate: null, isOverdue: false });
});

test("sem intervalDays: sem próxima data, nunca atrasado", () => {
  assert.deepEqual(computeCheckupDueState("2026-01-01", null), {
    nextDueDate: null,
    isOverdue: false,
  });
});

test("próxima data no futuro não está atrasada", () => {
  const today = dayjs("2026-01-10");
  const result = computeCheckupDueState("2026-01-01", 30, today);
  assert.equal(result.nextDueDate, "2026-01-31");
  assert.equal(result.isOverdue, false);
});

test("próxima data no passado está atrasada", () => {
  const today = dayjs("2026-02-15");
  const result = computeCheckupDueState("2026-01-01", 30, today);
  assert.equal(result.nextDueDate, "2026-01-31");
  assert.equal(result.isOverdue, true);
});

test("próxima data é hoje: ainda não considera atrasado", () => {
  const today = dayjs("2026-01-31");
  const result = computeCheckupDueState("2026-01-01", 30, today);
  assert.equal(result.isOverdue, false);
});
