import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldRedirectAuthenticatedToHome } from "./should-redirect-authenticated";

test("sem sessão nenhuma - nunca redireciona (mostra o formulário normalmente)", () => {
  assert.equal(shouldRedirectAuthenticatedToHome(null, false), false);
  assert.equal(shouldRedirectAuthenticatedToHome(undefined, false), false);
});

test("bug real corrigido: sessão logada mas AINDA NÃO verificada nunca redireciona - continua vendo /login e /register normalmente", () => {
  assert.equal(shouldRedirectAuthenticatedToHome("user-1", false), false);
});

test("sessão logada E verificada redireciona pra /home - não faz sentido mostrar login de novo", () => {
  assert.equal(shouldRedirectAuthenticatedToHome("user-1", true), true);
});
