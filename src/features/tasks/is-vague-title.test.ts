import assert from "node:assert/strict";
import test from "node:test";

import { isVagueTaskTitle } from "./is-vague-title";

test("isVagueTaskTitle: titulo vazio nao e vago (nada a sugerir ainda)", () => {
  assert.equal(isVagueTaskTitle(""), false);
  assert.equal(isVagueTaskTitle("   "), false);
});

test("isVagueTaskTitle: titulo curto demais e vago", () => {
  assert.equal(isVagueTaskTitle("ab"), true);
  assert.equal(isVagueTaskTitle("oi"), true);
});

test("isVagueTaskTitle: palavra generica e vaga, mesmo com espacos/maiusculas", () => {
  assert.equal(isVagueTaskTitle("Trabalho"), true);
  assert.equal(isVagueTaskTitle("  estudar  "), true);
});

test("isVagueTaskTitle: titulo especifico nao e vago", () => {
  assert.equal(isVagueTaskTitle("Estudar para a prova de matemática"), false);
  assert.equal(isVagueTaskTitle("Terminar relatório do cliente X"), false);
});
