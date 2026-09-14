import assert from "node:assert/strict";
import test from "node:test";

import { playMascotSound } from "./sound-effects";

test("playMascotSound: nunca lanca fora do navegador (sem window/AudioContext)", () => {
  assert.doesNotThrow(() => playMascotSound("cat"));
  assert.doesNotThrow(() => playMascotSound("dog"));
  assert.doesNotThrow(() => playMascotSound("bird"));
  assert.doesNotThrow(() => playMascotSound("bear"));
  assert.doesNotThrow(() => playMascotSound("fox"));
});

test("playMascotSound: personagem desconhecido nao lanca (so nao toca som)", () => {
  assert.doesNotThrow(() => playMascotSound("id-que-nao-existe"));
});
