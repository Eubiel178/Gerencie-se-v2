import assert from "node:assert/strict";
import test from "node:test";

import { deriveDisplayStatus } from "./derive-display-status";

test("deriveDisplayStatus: tarefa concluida sempre mostra completed, mesmo se ainda executando/pausada", () => {
  assert.equal(
    deriveDisplayStatus({ completed: true, workStatus: "in_progress", isExecuting: true }),
    "completed"
  );
  assert.equal(
    deriveDisplayStatus({ completed: true, workStatus: "paused", isExecuting: false }),
    "completed"
  );
});

test("deriveDisplayStatus: tarefa nunca iniciada fica idle (oculta)", () => {
  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "pending", isExecuting: false }),
    "idle"
  );
});

test("deriveDisplayStatus: Pausada -> Fazendo agora - workStatus muda antes do executionSession confirmar", () => {
  // Estado inicial: pausada.
  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "paused", isExecuting: false }),
    "paused"
  );

  // `replaceTask` já rodou (workStatus = in_progress), mas `resumeSession()`
  // ainda não resolveu (isExecuting ainda false nesse instante) - antes do
  // fix isso caia em "idle" (badge oculto). Deve continuar mostrando
  // "executing" direto, sem passar por um estado oculto no meio.
  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "in_progress", isExecuting: false }),
    "executing"
  );

  // `resumeSession()` resolveu, os dois lados concordam.
  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "in_progress", isExecuting: true }),
    "executing"
  );
});

test("deriveDisplayStatus: Fazendo agora -> Pausada - workStatus muda antes do pauseSession confirmar", () => {
  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "in_progress", isExecuting: true }),
    "executing"
  );

  // `replaceTask` já marcou workStatus = paused, mas `pauseSession()` ainda
  // não resolveu (isExecuting ainda true nesse instante) - workStatus
  // "paused" tem prioridade, então já mostra "paused" na hora.
  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "paused", isExecuting: true }),
    "paused"
  );

  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "paused", isExecuting: false }),
    "paused"
  );
});

test("deriveDisplayStatus: Pausada -> Fazendo agora repetidas vezes, nunca cai em idle com a tarefa ja iniciada", () => {
  const sequence: Array<Parameters<typeof deriveDisplayStatus>[0]> = [
    { completed: false, workStatus: "paused", isExecuting: false },
    { completed: false, workStatus: "in_progress", isExecuting: false },
    { completed: false, workStatus: "in_progress", isExecuting: true },
    { completed: false, workStatus: "paused", isExecuting: true },
    { completed: false, workStatus: "paused", isExecuting: false },
    { completed: false, workStatus: "in_progress", isExecuting: false },
    { completed: false, workStatus: "in_progress", isExecuting: true },
  ];

  for (const state of sequence) {
    assert.notEqual(
      deriveDisplayStatus(state),
      "idle",
      `nao deveria ficar oculto: ${JSON.stringify(state)}`
    );
  }
});

test("deriveDisplayStatus: Fazendo agora -> Concluida - completed vence mesmo com workStatus desatualizado", () => {
  // `completeSession()` resolveu (isExecuting caiu pra false porque o
  // status da execution session virou "completed"), mas `replaceTask` com
  // completed:true ainda nao rodou - workStatus ainda "in_progress" nesse
  // instante intermediario. Deve continuar mostrando "executing" (nao
  // "idle") ate o completed:true chegar.
  assert.equal(
    deriveDisplayStatus({ completed: false, workStatus: "in_progress", isExecuting: false }),
    "executing"
  );

  assert.equal(
    deriveDisplayStatus({ completed: true, workStatus: "in_progress", isExecuting: false }),
    "completed"
  );
});
