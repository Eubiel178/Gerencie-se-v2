import assert from "node:assert/strict";
import test from "node:test";

import { MASCOT_SPECIES_LIST } from "./mascot-species";

test("MASCOT_SPECIES_LIST: tem gato e cachorro, os unicos com personagem pronto", () => {
  assert.deepEqual(MASCOT_SPECIES_LIST, ["gato", "cachorro"]);
});
