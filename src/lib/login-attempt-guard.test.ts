import assert from "node:assert/strict";
import test from "node:test";

import { recordFailedAttempt, resetLoginAttemptState } from "./login-attempt-guard";

const NOW = new Date("2026-09-12T12:00:00.000Z");

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

test("recordFailedAttempt: primeira tentativa (estado nulo) começa a janela", () => {
  const { nextState, shouldSendAlert } = recordFailedAttempt(null, NOW);

  assert.equal(nextState.failedCount, 1);
  assert.deepEqual(nextState.windowStartedAt, NOW);
  assert.equal(shouldSendAlert, false);
});

test("recordFailedAttempt: acumula dentro da mesma janela", () => {
  const state = { failedCount: 2, windowStartedAt: minutesAgo(5), lastAlertSentAt: null };
  const { nextState, shouldSendAlert } = recordFailedAttempt(state, NOW);

  assert.equal(nextState.failedCount, 3);
  assert.equal(shouldSendAlert, false);
});

test("recordFailedAttempt: dispara alerta ao atingir o limiar (5)", () => {
  const state = { failedCount: 4, windowStartedAt: minutesAgo(10), lastAlertSentAt: null };
  const { nextState, shouldSendAlert } = recordFailedAttempt(state, NOW);

  assert.equal(shouldSendAlert, true);
  // Reinicia a contagem depois de alertar.
  assert.equal(nextState.failedCount, 0);
  assert.deepEqual(nextState.lastAlertSentAt, NOW);
});

test("recordFailedAttempt: janela expirada (>30min) reinicia a contagem em vez de acumular", () => {
  const state = { failedCount: 4, windowStartedAt: minutesAgo(45), lastAlertSentAt: null };
  const { nextState, shouldSendAlert } = recordFailedAttempt(state, NOW);

  assert.equal(nextState.failedCount, 1);
  assert.equal(shouldSendAlert, false);
});

test("recordFailedAttempt: cooldown ativo impede um segundo alerta logo em seguida", () => {
  const state = { failedCount: 4, windowStartedAt: minutesAgo(5), lastAlertSentAt: minutesAgo(10) };
  const { shouldSendAlert } = recordFailedAttempt(state, NOW);

  assert.equal(shouldSendAlert, false);
});

test("recordFailedAttempt: cooldown expirado permite um novo alerta", () => {
  const state = { failedCount: 4, windowStartedAt: minutesAgo(5), lastAlertSentAt: minutesAgo(90) };
  const { shouldSendAlert } = recordFailedAttempt(state, NOW);

  assert.equal(shouldSendAlert, true);
});

test("resetLoginAttemptState: sempre volta pro estado zerado", () => {
  assert.deepEqual(resetLoginAttemptState(), {
    failedCount: 0,
    windowStartedAt: null,
    lastAlertSentAt: null,
  });
});
