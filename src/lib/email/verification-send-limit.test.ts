import assert from "node:assert/strict";
import test from "node:test";

import {
  VERIFICATION_RESEND_COOLDOWN_MS,
  getVerificationResendRetryAfterSeconds,
} from "./verification-send-limit";

test("libera o primeiro envio quando ainda não existe código", () => {
  assert.equal(getVerificationResendRetryAfterSeconds(null), null);
});

test("informa os segundos restantes arredondando para cima", () => {
  const now = new Date("2026-09-17T12:00:00.000Z").getTime();
  const sentAt = new Date(now - 1_250);

  assert.equal(getVerificationResendRetryAfterSeconds(sentAt, now), 29);
});

test("libera novo envio exatamente ao fim do intervalo", () => {
  const now = new Date("2026-09-17T12:00:00.000Z").getTime();
  const sentAt = new Date(now - VERIFICATION_RESEND_COOLDOWN_MS);

  assert.equal(getVerificationResendRetryAfterSeconds(sentAt, now), null);
});
