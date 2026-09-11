import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";

import { calculateHasFullWeek } from "./definitions";

const NOW = dayjs("2026-09-10T12:00");

test("calculateHasFullWeek: true quando os ultimos 7 dias tem conclusao", () => {
  const dates = Array.from({ length: 7 }, (_, i) => NOW.subtract(i, "day").toDate());
  assert.equal(calculateHasFullWeek(dates, NOW), true);
});

test("calculateHasFullWeek: false quando falta um dia no meio", () => {
  const dates = [0, 1, 3, 4, 5, 6].map((i) => NOW.subtract(i, "day").toDate()); // falta o dia -2
  assert.equal(calculateHasFullWeek(dates, NOW), false);
});

test("calculateHasFullWeek: varias conclusoes no mesmo dia ainda contam so uma vez", () => {
  const dates = [
    ...Array.from({ length: 7 }, (_, i) => NOW.subtract(i, "day").toDate()),
    NOW.toDate(),
    NOW.toDate(),
  ];
  assert.equal(calculateHasFullWeek(dates, NOW), true);
});

test("calculateHasFullWeek: sem nenhuma conclusao e false", () => {
  assert.equal(calculateHasFullWeek([], NOW), false);
});
