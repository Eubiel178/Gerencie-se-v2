import assert from "node:assert/strict";
import test from "node:test";

import { getReadingProgress } from "./reading-progress";

test("getReadingProgress calcula percentual e páginas restantes", () => {
  assert.deepEqual(getReadingProgress(64, 320), {
    progressPercent: 20,
    remainingPages: 256,
  });
});

test("getReadingProgress limita valores fora do intervalo", () => {
  assert.deepEqual(getReadingProgress(500, 320), {
    progressPercent: 100,
    remainingPages: 0,
  });
});

test("getReadingProgress aceita começar na página zero", () => {
  assert.deepEqual(getReadingProgress(0, 320), {
    progressPercent: 0,
    remainingPages: 320,
  });
});
