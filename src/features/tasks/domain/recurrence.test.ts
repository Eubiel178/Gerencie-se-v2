import assert from "node:assert/strict";
import test from "node:test";

import { computeNextOccurrence } from "./recurrence";

test("sem recorrência: retorna null", () => {
  assert.equal(computeNextOccurrence("2026-10-01T14:30", "none"), null);
});

test("sem data agendada: retorna null mesmo com recorrência marcada", () => {
  assert.equal(computeNextOccurrence(undefined, "daily"), null);
  assert.equal(computeNextOccurrence(null, "weekly"), null);
});

test("diária: desloca exatamente 1 dia, mantendo o horário", () => {
  assert.equal(computeNextOccurrence("2026-10-01T14:30", "daily"), "2026-10-02T14:30");
});

test("semanal: desloca exatamente 7 dias, mantendo o horário", () => {
  assert.equal(computeNextOccurrence("2026-10-01T14:30", "weekly"), "2026-10-08T14:30");
});

test("diária atravessa virada de mês corretamente", () => {
  assert.equal(computeNextOccurrence("2026-10-31T09:00", "daily"), "2026-11-01T09:00");
});
