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

test("computeBubbleDisplayMs: com ações (decisão pendente) dura mais que o mesmo texto sem ações", () => {
  const text = "Quer ajuda com essa tarefa?";
  const withoutActions = computeBubbleDisplayMs(text);
  const withActions = computeBubbleDisplayMs(text, { hasActions: true });
  assert.ok(withActions > withoutActions);
});

test("computeBubbleDisplayMs: prioridade meaningful dura mais que casual pro mesmo texto", () => {
  const text = "Tarefa concluída.";
  const casual = computeBubbleDisplayMs(text, { priority: "casual" });
  const meaningful = computeBubbleDisplayMs(text, { priority: "meaningful" });
  assert.ok(meaningful > casual);
});

test("computeBubbleDisplayMs: com ações, o teto máximo é mais alto (nunca some antes de dar tempo de clicar)", () => {
  const ms = computeBubbleDisplayMs("a".repeat(1000), { hasActions: true });
  assert.ok(ms > 12000);
});
