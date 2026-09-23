import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";

import { buildHabitHeatmap } from "./build-habit-heatmap";

// Uma quarta-feira, só pra ter um ponto de referência fixo e previsível.
const NOW = dayjs("2026-09-09T12:00");

test("buildHabitHeatmap: cada semana tem exatamente 7 dias", () => {
  const weeks = buildHabitHeatmap([], 3, 4, NOW);

  assert.equal(weeks.length, 4);
  weeks.forEach((week) => assert.equal(week.length, 7));
});

test("buildHabitHeatmap: conta quantos habitos diferentes bateram no dia", () => {
  const today = NOW.format("YYYY-MM-DD");
  const dates = [today, today, today]; // 3 hábitos concluídos hoje

  const weeks = buildHabitHeatmap(dates, 3, 2, NOW);
  const todayCell = weeks.flat().find((day) => day.date === today);

  assert.ok(todayCell);
  assert.equal(todayCell?.count, 3);
  assert.equal(todayCell?.ratio, 1); // dia completo: 3 de 3 hábitos
});

test("buildHabitHeatmap: dia parcial fica com ratio entre 0 e 1", () => {
  const today = NOW.format("YYYY-MM-DD");
  const weeks = buildHabitHeatmap([today], 4, 2, NOW);
  const todayCell = weeks.flat().find((day) => day.date === today);

  assert.equal(todayCell?.ratio, 0.25);
});

test("buildHabitHeatmap: dias futuros (depois de now) sao marcados", () => {
  const weeks = buildHabitHeatmap([], 1, 2, NOW);
  const futureDays = weeks.flat().filter((day) => day.isFuture);

  assert.ok(futureDays.length > 0);
  futureDays.forEach((day) => assert.ok(dayjs(day.date).isAfter(NOW, "day")));
});
