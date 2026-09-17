import assert from "node:assert/strict";
import test from "node:test";

import { createReadingItemSchema, updateReadingDetailsSchema } from "./reading-schema";

test("createReadingItemSchema aceita livro sem dados de páginas", () => {
  assert.equal(
    createReadingItemSchema.safeParse({
      title: "Ensaio sobre a cegueira",
      author: null,
      totalPages: null,
      currentPage: null,
      dailyReadingGoal: null,
    }).success,
    true
  );
});

test("createReadingItemSchema aceita página atual zero", () => {
  assert.equal(
    createReadingItemSchema.safeParse({
      title: "Odisseia",
      totalPages: 416,
      currentPage: 0,
      dailyReadingGoal: 12,
    }).success,
    true
  );
});

test("createReadingItemSchema rejeita página além do total", () => {
  assert.equal(
    createReadingItemSchema.safeParse({
      title: "Odisseia",
      totalPages: 416,
      currentPage: 417,
      dailyReadingGoal: null,
    }).success,
    false
  );
});

test("updateReadingDetailsSchema aceita alterar todos os dados do livro", () => {
  assert.equal(
    updateReadingDetailsSchema.safeParse({
      id: "book-1",
      title: "Odisseia",
      author: "Homero",
      status: "reading",
      totalPages: 416,
      currentPage: 64,
      dailyReadingGoal: 12,
    }).success,
    true
  );
});

test("updateReadingDetailsSchema exige total quando há página atual", () => {
  assert.equal(
    updateReadingDetailsSchema.safeParse({
      id: "book-1",
      title: "Odisseia",
      author: null,
      status: "reading",
      totalPages: null,
      currentPage: 64,
      dailyReadingGoal: null,
    }).success,
    false
  );
});
