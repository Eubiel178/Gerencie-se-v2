import assert from "node:assert/strict";
import test from "node:test";

import { dateIsValid } from "./date-is-valid";

test("aceita uma data ISO válida", () => {
  assert.equal(dateIsValid("2026-09-10T14:30"), true);
});

test("rejeita uma data inválida", () => {
  assert.equal(dateIsValid("não é uma data"), false);
});
