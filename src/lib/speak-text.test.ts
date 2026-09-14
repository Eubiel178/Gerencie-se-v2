import assert from "node:assert/strict";
import test from "node:test";

import { toSpeechText } from "./speak-text";

test("toSpeechText: adiciona o acento em 'vei' pra soar natural na fala, sem mudar o resto", () => {
  assert.equal(
    toSpeechText("Nesse ritmo isso vira aposentadoria, vei."),
    "Nesse ritmo isso vira aposentadoria, véi."
  );
});

test("toSpeechText: não mexe em palavras que só contêm 'vei' como parte de outra palavra", () => {
  assert.equal(toSpeechText("Eu levei o caderno."), "Eu levei o caderno.");
});

test("toSpeechText: funciona com 'Vei' maiúsculo (início de frase)", () => {
  assert.equal(toSpeechText("Vei, que demora."), "véi, que demora.");
});

test("toSpeechText: texto sem nenhuma palavra da lista fica idêntico", () => {
  const text = "Boa tarde. Nada ainda por aqui, tudo bem.";
  assert.equal(toSpeechText(text), text);
});
