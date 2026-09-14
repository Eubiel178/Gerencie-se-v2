import assert from "node:assert/strict";
import test from "node:test";

import { ARRIVAL_THRESHOLD, clampToBounds, distance, isNearEdge, pickRandomTarget, stepToward } from "./movement";

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

test("pickRandomTarget: sempre cai dentro dos limites, mesmo com o viés de canto", () => {
  for (let i = 0; i < 200; i++) {
    const target = pickRandomTarget(BOUNDS);
    assert.ok(target.x >= BOUNDS.minX && target.x <= BOUNDS.maxX, `x fora dos limites: ${target.x}`);
    assert.ok(target.y >= BOUNDS.minY && target.y <= BOUNDS.maxY, `y fora dos limites: ${target.y}`);
  }
});

test("pickRandomTarget: a maioria dos alvos cai perto de um dos 4 cantos, não no centro (achado relatado: 'deveria parar nos cantos')", () => {
  const centerX = (BOUNDS.minX + BOUNDS.maxX) / 2;
  const centerY = (BOUNDS.minY + BOUNDS.maxY) / 2;
  const centerRadius = (BOUNDS.maxX - BOUNDS.minX) * 0.25;

  let nearCenterCount = 0;
  const samples = 300;

  for (let i = 0; i < samples; i++) {
    const target = pickRandomTarget(BOUNDS);
    if (distance(target, { x: centerX, y: centerY }) < centerRadius) nearCenterCount++;
  }

  // Com viés de canto (70% das vezes), só uma minoria pequena deve cair
  // perto do centro - sem o viés (uniforme), essa fração seria bem maior
  // (proporcional à área do círculo central, ~19,6% da área total).
  assert.ok(nearCenterCount / samples < 0.15, `caiu perto do centro demais: ${nearCenterCount}/${samples}`);
});
