import assert from "node:assert/strict";
import test from "node:test";

import { MASCOT_SPECIES_LIST } from "./mascot-species";

test("MASCOT_SPECIES_LIST: tem as especies com personagem pronto (gato, cachorro, passaro, urso, raposa)", () => {
  assert.deepEqual(MASCOT_SPECIES_LIST, ["gato", "cachorro", "passaro", "urso", "raposa"]);
});
