import assert from "node:assert/strict";
import test from "node:test";

import { MAX_MASCOT_SPEECH_LENGTH, isMascotSpeechValid } from "./mascot-speech";

test("aceita uma fala curta e rejeita texto vazio", () => {
  assert.equal(isMascotSpeechValid("Ótimo trabalho!"), true);
  assert.equal(isMascotSpeechValid("   "), false);
});

test("rejeita falas além do limite do mascote", () => {
  assert.equal(isMascotSpeechValid("a".repeat(MAX_MASCOT_SPEECH_LENGTH + 1)), false);
});
