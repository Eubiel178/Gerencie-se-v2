import assert from "node:assert/strict";
import test from "node:test";

import { greetingForHour } from "./greeting";

test("madrugada e manhã (0-11h): Bom dia", () => {
  assert.equal(greetingForHour(0), "Bom dia.");
  assert.equal(greetingForHour(8), "Bom dia.");
  assert.equal(greetingForHour(11), "Bom dia.");
});

test("tarde (12-17h): Boa tarde", () => {
  assert.equal(greetingForHour(12), "Boa tarde.");
  assert.equal(greetingForHour(17), "Boa tarde.");
});

test("noite (18-23h): Boa noite", () => {
  assert.equal(greetingForHour(18), "Boa noite.");
  assert.equal(greetingForHour(23), "Boa noite.");
});
