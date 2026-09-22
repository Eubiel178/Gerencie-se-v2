import assert from "node:assert/strict";
import test from "node:test";

import { getActionsForMove } from "./companion-moves";

test("getActionsForMove: movimentos de comentário puro nunca ganham ação (nunca virar barra de botões)", () => {
  for (const move of ["iniciar", "observar", "reconhecer", "comemorar", "dar-espaco"] as const) {
    assert.deepEqual(getActionsForMove(move, "afetuoso"), []);
  }
});

test("getActionsForMove: oferecer-ajuda/sugerir/perguntar sempre trazem exatamente duas opções", () => {
  for (const move of ["oferecer-ajuda", "sugerir", "perguntar"] as const) {
    const actions = getActionsForMove(move, "sarcastico");
    assert.equal(actions.length, 2);
    assert.ok(actions.every((a) => a.label.length > 0));
  }
});

test("getActionsForMove: rótulos variam por personalidade pro mesmo movimento (nunca os mesmos 3 botões sempre)", () => {
  const afetuoso = getActionsForMove("oferecer-ajuda", "afetuoso");
  const sarcastico = getActionsForMove("oferecer-ajuda", "sarcastico");

  assert.notDeepEqual(
    afetuoso.map((a) => a.label),
    sarcastico.map((a) => a.label)
  );
});
