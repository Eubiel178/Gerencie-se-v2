import assert from "node:assert/strict";
import test from "node:test";

import { computeBubbleDisplayMs } from "./bubble-timing";

test("computeBubbleDisplayMs: texto curto ainda recebe um mínimo confortável de leitura", () => {
  const ms = computeBubbleDisplayMs("Oi.");
  assert.ok(ms >= 4000);
});

test("computeBubbleDisplayMs: texto mais longo dura mais que um texto curto", () => {
  const short = computeBubbleDisplayMs("Voltou.");
  const long = computeBubbleDisplayMs(
    "Já são muitos minutos seguidos nessa tarefa, talvez seja hora de uma pausa curta."
  );
  assert.ok(long > short);
});

test("computeBubbleDisplayMs: nunca ultrapassa um teto máximo mesmo pra texto muito longo", () => {
  const ms = computeBubbleDisplayMs("a".repeat(1000));
  assert.ok(ms <= 12000);
});
