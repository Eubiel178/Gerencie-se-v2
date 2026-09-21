import assert from "node:assert/strict";
import test from "node:test";

import { formatElapsed } from "./deadline-helpers";

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
