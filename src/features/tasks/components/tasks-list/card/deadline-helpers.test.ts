import assert from "node:assert/strict";
import test from "node:test";

import { formatElapsed, formatElapsedSince } from "./deadline-helpers";

test("formatElapsed: menos de 1 minuto sempre 'agora', nunca '0 min'", () => {
  assert.equal(formatElapsed(0), "agora");
  assert.equal(formatElapsed(1), "agora");
  assert.equal(formatElapsed(59), "agora");
});

test("formatElapsed: 1 minuto exato", () => {
  assert.equal(formatElapsed(60), "há 1 min");
});

test("formatElapsed: 8 minutos", () => {
  assert.equal(formatElapsed(8 * 60), "há 8 min");
});

test("formatElapsed: minutos quebrados arredondam pra baixo", () => {
  assert.equal(formatElapsed(8 * 60 + 59), "há 8 min");
});

test("formatElapsed: passa de 1 hora usa formato Xh MMmin", () => {
  assert.equal(formatElapsed(60 * 60), "há 1h 00min");
  assert.equal(formatElapsed(60 * 65), "há 1h 05min");
});

test("formatElapsedSince: mesmo formato curto de formatElapsed, a partir de uma data", () => {
  const now = new Date("2026-01-01T12:00:00");
  assert.equal(formatElapsedSince(new Date("2026-01-01T11:52:00"), now), "há 8 min");
  assert.equal(formatElapsedSince(new Date("2026-01-01T10:55:00"), now), "há 1h 05min");
});

test("formatElapsedSince: nunca fica negativo se a data for no 'futuro' por um instante (relógios levemente fora de sincronia)", () => {
  const now = new Date("2026-01-01T12:00:00");
  assert.equal(formatElapsedSince(new Date("2026-01-01T12:00:05"), now), "agora");
});
