import assert from "node:assert/strict";
import test from "node:test";

import { ARRIVAL_THRESHOLD, clampToBounds, distance, isNearEdge, stepToward } from "./movement";

const BOUNDS = { minX: 0, maxX: 100, minY: 0, maxY: 100 };

test("distance: calcula a distância euclidiana entre dois pontos", () => {
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test("stepToward: anda em direção ao alvo sem ultrapassar", () => {
  const next = stepToward({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 1000);
  assert.equal(next.x, 10);
  assert.equal(next.y, 0);
});

test("stepToward: chega exatamente no alvo quando o passo é maior que a distância restante", () => {
  const next = stepToward({ x: 0, y: 0 }, { x: 5, y: 0 }, 10, 1000);
  assert.deepEqual(next, { x: 5, y: 0 });
});

test("stepToward: parado (position === target) não se move", () => {
  const next = stepToward({ x: 10, y: 10 }, { x: 10, y: 10 }, 50, 1000);
  assert.deepEqual(next, { x: 10, y: 10 });
});

test("clampToBounds: mantém posição dentro dos limites", () => {
  assert.deepEqual(clampToBounds({ x: -10, y: 200 }, BOUNDS), { x: 0, y: 100 });
  assert.deepEqual(clampToBounds({ x: 50, y: 50 }, BOUNDS), { x: 50, y: 50 });
});

test("isNearEdge: detecta proximidade de qualquer uma das quatro bordas", () => {
  assert.equal(isNearEdge({ x: 5, y: 50 }, BOUNDS), true);
  assert.equal(isNearEdge({ x: 95, y: 50 }, BOUNDS), true);
  assert.equal(isNearEdge({ x: 50, y: 5 }, BOUNDS), true);
  assert.equal(isNearEdge({ x: 50, y: 95 }, BOUNDS), true);
  assert.equal(isNearEdge({ x: 50, y: 50 }, BOUNDS), false);
});

test("ARRIVAL_THRESHOLD: é um valor positivo pequeno (evita oscilar em torno do alvo)", () => {
  assert.ok(ARRIVAL_THRESHOLD > 0 && ARRIVAL_THRESHOLD < 20);
});
