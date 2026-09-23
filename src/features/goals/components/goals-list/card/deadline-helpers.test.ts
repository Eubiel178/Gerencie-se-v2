import assert from "node:assert/strict";
import test from "node:test";

import { formatGoalDeadline, isGoalOverdue } from "./deadline-helpers";

function isoToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isoOffsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("formatGoalDeadline: hoje", () => {
  assert.equal(formatGoalDeadline(isoToday()), "Hoje");
});

test("formatGoalDeadline: amanhã", () => {
  assert.equal(formatGoalDeadline(isoOffsetDays(1)), "Amanhã");
});

test("formatGoalDeadline: outra data usa dia/mês curto", () => {
  const result = formatGoalDeadline(isoOffsetDays(10));
  assert.ok(!result.includes("Hoje"));
  assert.ok(!result.includes("Amanhã"));
});

test("isGoalOverdue: prazo hoje NÃO é atrasado (só data, sem hora)", () => {
  assert.equal(isGoalOverdue(isoToday()), false);
});

test("isGoalOverdue: prazo ontem é atrasado", () => {
  assert.equal(isGoalOverdue(isoOffsetDays(-1)), true);
});

test("isGoalOverdue: prazo amanhã não é atrasado", () => {
  assert.equal(isGoalOverdue(isoOffsetDays(1)), false);
});
