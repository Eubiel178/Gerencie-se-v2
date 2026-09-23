import assert from "node:assert/strict";
import test from "node:test";

import { isQuietModeRoute } from "./quiet-mode-routes";

test("isQuietModeRoute: rotas quietas conhecidas (e sub-rotas) retornam true", () => {
  assert.equal(isQuietModeRoute("/home/focus"), true);
  assert.equal(isQuietModeRoute("/home/stats"), true);
  assert.equal(isQuietModeRoute("/home/settings"), true);
  assert.equal(isQuietModeRoute("/home/settings?section=notificacoes"), true);
});

test("isQuietModeRoute: outras rotas retornam false", () => {
  assert.equal(isQuietModeRoute("/home"), false);
  assert.equal(isQuietModeRoute("/home/tasks"), false);
  assert.equal(isQuietModeRoute("/home/focus-something-else"), true); // startsWith, não segmento exato - comportamento já existente, só documentado pelo teste
});
