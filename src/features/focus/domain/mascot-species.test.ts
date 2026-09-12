import assert from "node:assert/strict";
import test from "node:test";

import { breedsForSpecies, isValidBreedForSpecies } from "./mascot-species";

test("breedsForSpecies: cada especie tem pelo menos uma raca", () => {
  assert.ok(breedsForSpecies("gato").length > 0);
  assert.ok(breedsForSpecies("cachorro").length > 0);
  assert.ok(breedsForSpecies("coelho").length > 0);
  assert.ok(breedsForSpecies("galinha").length > 0);
});

test("isValidBreedForSpecies: raca existente na especie certa e valida", () => {
  assert.equal(isValidBreedForSpecies("gato", "laranja"), true);
  assert.equal(isValidBreedForSpecies("cachorro", "vira-lata"), true);
});

test("isValidBreedForSpecies: raca de outra especie e invalida", () => {
  assert.equal(isValidBreedForSpecies("coelho", "vira-lata"), false);
  assert.equal(isValidBreedForSpecies("galinha", "laranja"), false);
});

test("isValidBreedForSpecies: raca inexistente e invalida", () => {
  assert.equal(isValidBreedForSpecies("gato", "xadrez"), false);
});
