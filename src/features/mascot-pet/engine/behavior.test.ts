import assert from "node:assert/strict";
import test from "node:test";

import { MascotBehavior } from "./behavior";

const BOUNDS = { minX: 0, maxX: 200, minY: 0, maxY: 200 };

test("MascotBehavior: começa parado (idle) na posição inicial", () => {
  const behavior = new MascotBehavior({ x: 50, y: 50 });
  const snapshot = behavior.snapshot();

  assert.equal(snapshot.state, "idle");
  assert.deepEqual(snapshot.position, { x: 50, y: 50 });
});

test("MascotBehavior: sai do idle depois de tempo suficiente (anda ou dorme, nunca fica parado pra sempre)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });

  behavior.tick(10_000, BOUNDS);

  assert.notEqual(behavior.snapshot().state, "idle");
});

test("MascotBehavior: clique sempre entra em 'interaction', mesmo andando", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.tick(10_000, BOUNDS);

  behavior.handleClick();

  assert.equal(behavior.snapshot().state, "interaction");
});

test("MascotBehavior: reação transitória (interaction) volta pro idle sozinha depois de um tempo", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.handleClick();
  assert.equal(behavior.snapshot().state, "interaction");

  behavior.tick(5_000, BOUNDS);

  assert.equal(behavior.snapshot().state, "idle");
});

test("MascotBehavior: evento externo mapeia pro estado reativo certo", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });

  behavior.handleEvent("task-completed");
  assert.equal(behavior.snapshot().state, "celebrate");

  behavior.handleEvent("action-error");
  assert.equal(behavior.snapshot().state, "sad");
});

test("MascotBehavior: com reduced motion, nunca sai do idle sozinho (só reage a clique/evento)", () => {
  const behavior = new MascotBehavior({ x: 100, y: 100 });
  behavior.setReducedMotion(true);

  behavior.tick(30_000, BOUNDS);
  assert.equal(behavior.snapshot().state, "idle");

  behavior.handleClick();
  assert.equal(behavior.snapshot().state, "interaction");
});

test("MascotBehavior: clampToBounds traz posição/alvo de volta pra dentro de limites menores (ex.: resize)", () => {
  const behavior = new MascotBehavior({ x: 190, y: 190 });

  behavior.clampToBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 });

  const snapshot = behavior.snapshot();
  assert.ok(snapshot.position.x <= 100 && snapshot.position.y <= 100);
});
