import assert from "node:assert/strict";
import test from "node:test";

import { buildHabitConsistencyTrend } from "./build-habit-consistency-trend";
import { HeatmapDay } from "./build-habit-heatmap";

function day(date: string, ratio: number, isFuture = false): HeatmapDay {
  return { date, count: Math.round(ratio * 2), ratio, isFuture };
}

test("buildHabitConsistencyTrend: media simples de uma semana completa", () => {
  const week = [
    day("2026-01-04", 1),
    day("2026-01-05", 0.5),
    day("2026-01-06", 0),
    day("2026-01-07", 1),
    day("2026-01-08", 0.5),
    day("2026-01-09", 0),
    day("2026-01-10", 1),
  ];

  const [point] = buildHabitConsistencyTrend([week]);

  assert.equal(point.weekStartDate, "2026-01-04");
  assert.equal(point.weekEndDate, "2026-01-10");
  // media = (1+0.5+0+1+0.5+0+1)/7 = 0.5714... -> 57%
  assert.equal(point.percent, 57);
});

test("buildHabitConsistencyTrend: semana em andamento ignora dias futuros na media", () => {
  const week = [
    day("2026-01-04", 1),
    day("2026-01-05", 1),
    day("2026-01-06", 0, true),
    day("2026-01-07", 0, true),
    day("2026-01-08", 0, true),
    day("2026-01-09", 0, true),
    day("2026-01-10", 0, true),
  ];

  const [point] = buildHabitConsistencyTrend([week]);

  // so os 2 dias passados contam - 100%, nao 28% (2/7)
  assert.equal(point.percent, 100);
});

test("buildHabitConsistencyTrend: ratio acima de 1 fica limitado a 100%", () => {
  const week = [day("2026-01-04", 1.5), ...Array(6).fill(day("2026-01-05", 1.5))];

  const [point] = buildHabitConsistencyTrend([week]);

  assert.equal(point.percent, 100);
});
