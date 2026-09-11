import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import { toXlsx } from "./xlsx";

async function readBack(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  // `exceljs` referencia um `Buffer` ligeiramente diferente do global do
  // Node instalado aqui (falta de sincronia entre pacotes de tipos) —
  // o valor em si é o mesmo Buffer de sempre, só o tipo estático diverge.
  await workbook.xlsx.load(buffer as never);
  return workbook.worksheets[0];
}

test("toXlsx: lista vazia ainda gera um arquivo valido, sem linhas", async () => {
  const buffer = await toXlsx([]);
  const sheet = await readBack(buffer);

  assert.equal(sheet.rowCount, 0);
});

test("toXlsx: cabecalho vem das chaves do primeiro objeto", async () => {
  const buffer = await toXlsx([{ titulo: "Estudar", status: "pendente" }]);
  const sheet = await readBack(buffer);

  assert.equal(sheet.getRow(1).getCell(1).value, "titulo");
  assert.equal(sheet.getRow(1).getCell(2).value, "status");
});

test("toXlsx: null/undefined viram celula vazia, Date vira data de verdade", async () => {
  const date = new Date("2026-01-15T00:00:00.000Z");
  const buffer = await toXlsx([{ nome: null, criadoEm: date }]);
  const sheet = await readBack(buffer);

  const row = sheet.getRow(2);
  assert.equal(row.getCell(1).value, "");
  assert.equal((row.getCell(2).value as Date).toISOString(), date.toISOString());
});

test("toXlsx: lista vira uma unica celula com valores separados por ponto-e-virgula", async () => {
  const buffer = await toXlsx([{ tags: ["a", "b", "c"] }]);
  const sheet = await readBack(buffer);

  assert.equal(sheet.getRow(2).getCell(1).value, "a; b; c");
});
