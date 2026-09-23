import assert from "node:assert/strict";
import test from "node:test";

import { filterReadingItems } from "./filter-reading-items";

function item(overrides: Partial<Parameters<typeof filterReadingItems>[0][number]>) {
  return {
    id: "r1",
    userId: "u1",
    title: "Clean Code",
    author: "Robert Martin",
    status: "reading" as const,
    progressPercent: 50,
    addedAt: new Date(),
    ...overrides,
  };
}

test("filterReadingItems: busca por titulo", () => {
  const items = [item({ title: "Clean Code" }), item({ title: "Refactoring" })];
  const result = filterReadingItems(items, { searchQuery: "clean", statusFilter: "all" });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Clean Code");
});

test("filterReadingItems: busca tambem olha o autor", () => {
  const items = [item({ title: "Clean Code", author: "Robert Martin" }), item({ title: "Refactoring", author: "Martin Fowler" })];
  const result = filterReadingItems(items, { searchQuery: "fowler", statusFilter: "all" });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Refactoring");
});

test("filterReadingItems: filtro de status", () => {
  const items = [item({ status: "finished" }), item({ status: "reading" })];
  const result = filterReadingItems(items, { searchQuery: "", statusFilter: "finished" });

  assert.equal(result.length, 1);
  assert.equal(result[0].status, "finished");
});
