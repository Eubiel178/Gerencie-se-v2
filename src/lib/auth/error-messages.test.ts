import assert from "node:assert/strict";
import test from "node:test";

import { authErrorMessage } from "./error-messages";

test("traduz códigos conhecidos de login Google", () => {
  assert.match(
    authErrorMessage("AccessDenied") ?? "",
    /acesso à sua conta Google foi cancelado/i,
  );
  assert.match(authErrorMessage("Configuration") ?? "", /configurado/i);
});

test("mantém uma mensagem segura para um código desconhecido da URL", () => {
  assert.equal(
    authErrorMessage("CredentialsSignin"),
    "Não foi possível concluir o login. Tente novamente.",
  );
  assert.equal(
    authErrorMessage("toString"),
    "Não foi possível concluir o login. Tente novamente.",
  );
  assert.equal(authErrorMessage(null), null);
});
