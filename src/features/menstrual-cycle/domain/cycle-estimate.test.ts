import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";

import { ICycleEntry } from "./cycle-entry";
import { calculateCycleEstimate } from "./cycle-estimate";

function entry(startDate: string): ICycleEntry {
  return {
    id: startDate,
    userId: "u1",
    startDate,
    periodLengthDays: null,
    symptoms: [],
    notes: null,
    createdAt: new Date(startDate),
  };
}

test("sem histórico: tudo null", () => {
  assert.deepEqual(calculateCycleEstimate([]), {
    averageCycleLengthDays: null,
    nextEstimatedStartDate: null,
    currentCycleDay: null,
  });
});

test("um único registro: sem média (precisa de ao menos 2 pra calcular intervalo)", () => {
  const today = dayjs("2026-01-10");
  const result = calculateCycleEstimate([entry("2026-01-01")], today);
  assert.equal(result.averageCycleLengthDays, null);
  assert.equal(result.nextEstimatedStartDate, null);
  assert.equal(result.currentCycleDay, 10);
});

test("calcula média dos intervalos e projeta a próxima data, independente da ordem de entrada", () => {
  const today = dayjs("2026-03-05");
  const entries = [entry("2026-03-01"), entry("2026-01-01"), entry("2026-02-01")];

  const result = calculateCycleEstimate(entries, today);
  assert.equal(result.averageCycleLengthDays, 30); // jan->fev: 31, fev->mar: 28 -> média 30 (arredondado)
  assert.equal(result.nextEstimatedStartDate, "2026-03-31");
  assert.equal(result.currentCycleDay, 5);
});
