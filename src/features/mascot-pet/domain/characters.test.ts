import assert from "node:assert/strict";
import test from "node:test";

import { MASCOT_CHARACTERS, characterIdForSpecies } from "./characters";

test("characterIdForSpecies: especies com atlas pronto mapeiam pro personagem certo", () => {
  assert.equal(characterIdForSpecies("gato"), "cat");
  assert.equal(characterIdForSpecies("cachorro"), "dog");
});

test("characterIdForSpecies: especie sem atlas ainda (coelho/galinha) nao mostra o bicho errado", () => {
  assert.equal(characterIdForSpecies("coelho"), null);
  assert.equal(characterIdForSpecies("galinha"), null);
});

test("MASCOT_CHARACTERS: cada personagem cadastrado tem todos os estados com pelo menos um frame", () => {
  for (const character of Object.values(MASCOT_CHARACTERS)) {
    for (const frames of Object.values(character.animations)) {
      assert.ok(frames.length > 0, `${character.id} tem um estado sem frame`);
      for (const frameName of frames) {
        assert.ok(character.frameRects[frameName], `${character.id}: frame "${frameName}" nao existe no atlas`);
      }
    }
  }
});
