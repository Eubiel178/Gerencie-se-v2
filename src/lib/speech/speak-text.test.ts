import assert from "node:assert/strict";
import test from "node:test";

import { pickPortugueseVoice, toSpeechText } from "./speak-text";

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

test("toSpeechText: jargão técnico em frase real é reescrito pra soletrar bem", () => {
  assert.equal(
    toSpeechText("Vamos revisar a API do projeto React? Vou usar Next.js com TypeScript e JavaScript."),
    "Vamos revisar a a-pê-i do projeto ri-ácte? Vou usar néxti-jéss com tái-pe-scrípti e jáva-scrípti."
  );
});

test("toSpeechText: 'IA' maiúsculo soletra 'i-a', mas nunca mexe no verbo 'ia'", () => {
  assert.equal(toSpeechText("A IA entendeu o passo."), "A i-a entendeu o passo.");
  assert.equal(toSpeechText("Eu ia sair agora, ela ia junto."), "Eu ia sair agora, ela ia junto.");
  assert.equal(toSpeechText("O Iago ia de ônibus."), "O Iago ia de ônibus.");
});

test("toSpeechText: 'HTML' e 'CSS' soletram letra a letra", () => {
  assert.equal(toSpeechText("Montei o HTML e ajustei o CSS."), "Montei o agá-tê-eme-éle e ajustei o cê-ésse-ésse.");
});

test("toSpeechText: 'React' e 'Next.js' são corrigidos mesmo no meio da frase", () => {
  assert.equal(toSpeechText("A tarefa React acabou. E o Next.js?"), "A tarefa ri-ácte acabou. E o néxti-jéss?");
});

test("toSpeechText: título de tarefa em português não é corrompido pela camada", () => {
  const title = "Estudar física e revisar a redação";
  assert.equal(toSpeechText(title), title);
});

test("pickPortugueseVoice: prefere voz pt-BR neural quando existe", () => {
  const voices = [
    { lang: "en-US", name: "Microsoft Aria Online (Natural)" },
    { lang: "pt-BR", name: "Microsoft Francine Online (Natural)" },
    { lang: "pt-BR", name: "Google português do Brasil" },
  ] as SpeechSynthesisVoice[];
  const picked = pickPortugueseVoice(voices);
  assert.equal(picked?.name, "Microsoft Francine Online (Natural)");
  assert.equal(picked?.lang, "pt-BR");
});

test("pickPortugueseVoice: aceita primeira voz pt-BR sem devolver nada estranho", () => {
  const voices = [
    { lang: "en-US", name: "Microsoft Aria" },
    { lang: "pt-PT", name: "Voz de Portugal" },
    { lang: "pt-BR", name: "Microsoft Daniel" },
  ] as SpeechSynthesisVoice[];
  const picked = pickPortugueseVoice(voices);
  assert.equal(picked?.lang, "pt-BR");
  assert.equal(picked?.name, "Microsoft Daniel");
});

test("pickPortugueseVoice: devolve null sem nenhuma voz pt-BR", () => {
  const voices = [
    { lang: "en-US", name: "Microsoft Aria" },
    { lang: "fr-FR", name: "Microsoft Denise" },
  ] as SpeechSynthesisVoice[];
  assert.equal(pickPortugueseVoice(voices), null);
});

test("pickPortugueseVoice: devolve null com lista vazia ou voz sem idioma", () => {
  assert.equal(pickPortugueseVoice([]), null);
  assert.equal(pickPortugueseVoice([{ lang: "", name: "Stranger" }] as SpeechSynthesisVoice[]), null);
});
