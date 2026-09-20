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

test("toCsv: neutraliza prefixo de formula (CSV injection)", () => {
  const csv = toCsv([
    { title: "=cmd|'/c calc'!A1" },
    { title: "+1+1" },
    { title: "-1+1" },
    { title: "@SUM(A1)" },
  ]);
  const rows = csv.split("\r\n").slice(1);

  assert.equal(rows[0], "'=cmd|'/c calc'!A1");
  assert.equal(rows[1], "'+1+1");
  assert.equal(rows[2], "'-1+1");
  assert.equal(rows[3], "'@SUM(A1)");
});

test("toCsv: nao mexe em campo que so contem = no meio, nao no inicio", () => {
  const csv = toCsv([{ title: "a=b" }]);
  const [, row] = csv.split("\r\n");

  assert.equal(row, "a=b");
});
