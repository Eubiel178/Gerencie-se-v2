import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEmail } from "./normalize-email";

test("normalizeEmail: baixa a caixa e remove espaços nas pontas", () => {
  assert.equal(normalizeEmail("  User@X.com  "), "user@x.com");
});

test("normalizeEmail: já normalizado permanece igual", () => {
  assert.equal(normalizeEmail("user@x.com"), "user@x.com");
});
