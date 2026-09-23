import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";

import { calculateHabitStats } from "./streak";

const TODAY = dayjs("2026-09-10");

test("nenhum registro: tudo zerado, hoje não concluído", () => {
  const stats = calculateHabitStats(new Set(), TODAY);
  assert.deepEqual(stats, {
    completedToday: false,
    currentStreak: 0,
    completionsThisWeek: 0,
  });
});

test("marcado hoje: completedToday true e sequência de 1", () => {
  const stats = calculateHabitStats(new Set(["2026-09-10"]), TODAY);
  assert.equal(stats.completedToday, true);
  assert.equal(stats.currentStreak, 1);
});

test("sequência perdoa hoje ainda não marcado, se ontem foi marcado", () => {
  const stats = calculateHabitStats(new Set(["2026-09-09"]), TODAY);
  assert.equal(stats.completedToday, false);
  assert.equal(stats.currentStreak, 1);
});

test("sequência quebra (0) quando ontem também está faltando", () => {
  const stats = calculateHabitStats(new Set(["2026-09-07"]), TODAY);
  assert.equal(stats.currentStreak, 0);
});

test("sequência conta dias consecutivos até encontrar um buraco", () => {
  const dates = new Set(["2026-09-10", "2026-09-09", "2026-09-08", "2026-09-06"]);
  const stats = calculateHabitStats(dates, TODAY);
  // 10, 9, 8 são consecutivos; dia 7 falta, então para aí (dia 6 não conta).
  assert.equal(stats.currentStreak, 3);
});

test("completionsThisWeek conta só os últimos 7 dias (hoje incluso)", () => {
  const dates = new Set([
    "2026-09-10",
    "2026-09-08",
    "2026-09-04", // dentro da janela de 7 dias (hoje - 6)
    "2026-09-02", // fora da janela de 7 dias
  ]);
  const stats = calculateHabitStats(dates, TODAY);
  assert.equal(stats.completionsThisWeek, 3);
});
