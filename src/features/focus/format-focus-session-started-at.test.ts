import assert from "node:assert/strict";
import test from "node:test";

import { formatFocusSessionStartedAt } from "./format-focus-session-started-at";

const INSTANT = new Date("2026-09-17T22:07:00.000Z");

test("formata o mesmo instante no fuso IANA do usuário", () => {
  assert.equal(formatFocusSessionStartedAt(INSTANT, "America/Noronha"), "17/09, 20:07");
  assert.equal(formatFocusSessionStartedAt(INSTANT, "America/Sao_Paulo"), "17/09, 19:07");
  assert.equal(formatFocusSessionStartedAt(INSTANT, "UTC"), "17/09, 22:07");
});

test("não deixa uma preferência de fuso inválida derrubar o histórico", () => {
  assert.equal(formatFocusSessionStartedAt(INSTANT, "fuso-invalido"), "17/09, 22:07");
});
