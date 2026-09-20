import assert from "node:assert/strict";
import test from "node:test";

import { wasSmtpDeliveryAccepted } from "./smtp-delivery";

test("aceita envio somente quando o SMTP aceitou todos os destinatários", () => {
  assert.equal(wasSmtpDeliveryAccepted({ accepted: ["pessoa@exemplo.com"], rejected: [] }), true);
});

test("rejeição do SMTP não é reportada como envio concluído", () => {
  assert.equal(wasSmtpDeliveryAccepted({ accepted: [], rejected: ["pessoa@exemplo.com"] }), false);
  assert.equal(
    wasSmtpDeliveryAccepted({
      accepted: ["pessoa@exemplo.com"],
      rejected: ["outro@exemplo.com"],
    }),
    false
  );
});
