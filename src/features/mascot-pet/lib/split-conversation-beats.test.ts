import assert from "node:assert/strict";
import test from "node:test";

import { splitIntoConversationBeats } from "./split-conversation-beats";

test("sem marcador: devolve a resposta inteira como uma única bolha", () => {
  const result = splitIntoConversationBeats("Oi! Tudo bem?");
  assert.deepEqual(result, ["Oi! Tudo bem?"]);
});

test("com marcador: divide em duas bolhas, aparadas", () => {
  const result = splitIntoConversationBeats("kkkk\n%%%\nmas falando sério, o que rolou?");
  assert.deepEqual(result, ["kkkk", "mas falando sério, o que rolou?"]);
});

test("três bolhas genuínas são preservadas", () => {
  const result = splitIntoConversationBeats("a%%%b%%%c");
  assert.deepEqual(result, ["a", "b", "c"]);
});

test("mais de três bolhas: corta na terceira, nunca mais que isso", () => {
  const result = splitIntoConversationBeats("a%%%b%%%c%%%d%%%e");
  assert.deepEqual(result, ["a", "b", "c"]);
});

test("marcador com espaço/linha em volta ainda funciona", () => {
  const result = splitIntoConversationBeats("primeira parte\n%%%\nsegunda parte");
  assert.deepEqual(result, ["primeira parte", "segunda parte"]);
});

test("marcador seguido de parte vazia é descartado, não vira bolha vazia", () => {
  const result = splitIntoConversationBeats("só isso%%%");
  assert.deepEqual(result, ["só isso"]);
});

test("texto vazio devolve uma bolha vazia (nunca lista vazia)", () => {
  const result = splitIntoConversationBeats("");
  assert.deepEqual(result, [""]);
});

test("nunca corta uma frase normal sem o marcador explícito", () => {
  const text = "Isso é uma frase normal, com vírgula e tudo, sem separador nenhum.";
  const result = splitIntoConversationBeats(text);
  assert.deepEqual(result, [text]);
});
