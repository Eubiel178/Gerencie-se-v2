import assert from "node:assert/strict";
import test from "node:test";

import { isFocusSessionExpired } from "./session-expiry";

test("sessão recém-iniciada não está expirada", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  const startedAt = new Date("2026-01-01T12:00:00Z");
  assert.equal(isFocusSessionExpired({ startedAt, plannedDurationSeconds: 1500 }, now), false);
});

test("sessão dentro do tempo planejado não está expirada", () => {
  const startedAt = new Date("2026-01-01T12:00:00Z");
  const now = new Date("2026-01-01T12:20:00Z"); // 20 min de uma sessão de 25 min
  assert.equal(isFocusSessionExpired({ startedAt, plannedDurationSeconds: 1500 }, now), false);
});

test("sessão exatamente no limite está expirada", () => {
  const startedAt = new Date("2026-01-01T12:00:00Z");
  const now = new Date("2026-01-01T12:25:00Z"); // exatamente 25 min
  assert.equal(isFocusSessionExpired({ startedAt, plannedDurationSeconds: 1500 }, now), true);
});

test("sessão órfã (aba fechada há dias) está expirada", () => {
  const startedAt = new Date("2026-01-01T12:00:00Z");
  const now = new Date("2026-01-04T12:00:00Z"); // 3 dias depois
  assert.equal(isFocusSessionExpired({ startedAt, plannedDurationSeconds: 1500 }, now), true);
});
