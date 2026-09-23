import assert from "node:assert/strict";
import test from "node:test";

import { shouldReplaceInteraction } from "./interaction-policy";

test("shouldReplaceInteraction: nada sendo mostrado sempre aceita o candidato", () => {
  assert.equal(shouldReplaceInteraction(null, "casual"), true);
  assert.equal(shouldReplaceInteraction(null, "meaningful"), true);
});

test("shouldReplaceInteraction: candidato meaningful sempre substitui, mesmo outro meaningful no ar", () => {
  assert.equal(shouldReplaceInteraction({ priority: "meaningful" }, "meaningful"), true);
  assert.equal(shouldReplaceInteraction({ priority: "casual" }, "meaningful"), true);
});

test("shouldReplaceInteraction: candidato casual nunca atropela um meaningful ainda no ar", () => {
  assert.equal(shouldReplaceInteraction({ priority: "meaningful" }, "casual"), false);
});

test("shouldReplaceInteraction: candidato casual substitui outro casual (info mais fresca)", () => {
  assert.equal(shouldReplaceInteraction({ priority: "casual" }, "casual"), true);
});
