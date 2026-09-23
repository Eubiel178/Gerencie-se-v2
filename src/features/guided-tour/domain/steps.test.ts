import assert from "node:assert/strict";
import { test } from "node:test";

import { buildGuidedTourSteps, MASCOT_STEP_INTRO } from "./steps";

const PERSONALITIES = ["afetuoso", "sarcastico", "engracado", "motivador", "zen"] as const;

test("tour tem 6 passos, nessa ordem", () => {
  const steps = buildGuidedTourSteps("Rex", "afetuoso");
  assert.deepEqual(
    steps.map((s) => s.id),
    ["welcome", "nav", "checklist", "mascot", "new-task", "done"]
  );
});

test("só o passo do mascote fala como o Companion", () => {
  const steps = buildGuidedTourSteps("Rex", "afetuoso");
  const speaking = steps.filter((s) => s.speaksAsCompanion);
  assert.deepEqual(speaking.map((s) => s.id), ["mascot"]);
});

test("todas as 5 personalidades têm introdução escrita e falada, não vazias", () => {
  for (const personality of PERSONALITIES) {
    const intro = MASCOT_STEP_INTRO[personality];
    assert.ok(intro.written.length > 0, `${personality}: written vazio`);
    assert.ok(intro.spoken.length > 0, `${personality}: spoken vazio`);
  }
});

test("introdução do mascote cobre os 3 conceitos pedidos: ficar durante execução, reagir, ajudar se travar/distrair", () => {
  for (const personality of PERSONALITIES) {
    const { written } = MASCOT_STEP_INTRO[personality];
    assert.match(written, /execu/i, `${personality}: não menciona execução`);
    assert.match(written, /trav|distra/i, `${personality}: não menciona travar/se distrair`);
  }
});

test("passo do mascote usa o texto ESCRITO (não o falado) como corpo do tooltip", () => {
  const steps = buildGuidedTourSteps("Rex", "zen");
  const mascotStep = steps.find((s) => s.id === "mascot");
  assert.equal(mascotStep?.body, MASCOT_STEP_INTRO.zen.written);
});
