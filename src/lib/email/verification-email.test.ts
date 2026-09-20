import assert from "node:assert/strict";
import test from "node:test";

import { renderVerificationCodeEmail } from "./verification-email";

test("e-mail de verificação não usa nome de perfil", () => {
  const email = renderVerificationCodeEmail({ code: "123456" });

  assert.match(email, /Confirme seu e-mail<\/h1>/);
  assert.doesNotMatch(email, /Chunchumaru/);
  assert.match(email, /123456/);
});
