import assert from "node:assert/strict";
import test from "node:test";

import { toCsv } from "./csv";

test("toCsv: lista vazia retorna string vazia", () => {
  assert.equal(toCsv([]), "");
});

test("toCsv: cabecalho vem das chaves do primeiro objeto", () => {
  const csv = toCsv([{ title: "Estudar", priority: "alta" }]);
  const [header, row] = csv.split("\r\n");

  assert.equal(header, "title,priority");
  assert.equal(row, "Estudar,alta");
});

test("toCsv: escapa campo com virgula, aspas e quebra de linha", () => {
  const csv = toCsv([{ title: 'Ler, "Clean Code"\ne revisar' }]);
  const [, row] = csv.split("\r\n");

  assert.equal(row, '"Ler, ""Clean Code""\ne revisar"');
});

test("toCsv: null/undefined viram campo vazio, Date vira ISO", () => {
  const date = new Date("2026-01-01T00:00:00.000Z");
  const csv = toCsv([{ a: null, b: undefined, c: date }]);
  const [, row] = csv.split("\r\n");

  assert.equal(row, ",,2026-01-01T00:00:00.000Z");
});
