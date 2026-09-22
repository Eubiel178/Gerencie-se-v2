import assert from "node:assert/strict";
import test from "node:test";

import { findNextRoutineItemId } from "./find-next-routine-item";

function item(id: string, time: string, completedToday = false) {
  return { id, time, title: id, completedToday, isSharedWithMe: false, userId: "u", createdAt: new Date() } as never;
}

test("acha o primeiro item não concluído com horário ainda não passado", () => {
  const items = [item("a", "07:00", true), item("b", "09:00"), item("c", "14:00")];
  assert.equal(findNextRoutineItemId(items, "08:00"), "b");
});

test("horário igual ao atual ainda conta como próximo", () => {
  const items = [item("a", "09:00")];
  assert.equal(findNextRoutineItemId(items, "09:00"), "a");
});

test("todos concluídos: nenhum próximo", () => {
  const items = [item("a", "09:00", true), item("b", "14:00", true)];
  assert.equal(findNextRoutineItemId(items, "08:00"), null);
});

test("todos os horários já passaram: nenhum próximo", () => {
  const items = [item("a", "07:00"), item("b", "08:00")];
  assert.equal(findNextRoutineItemId(items, "20:00"), null);
});

test("lista vazia: nenhum próximo", () => {
  assert.equal(findNextRoutineItemId([], "10:00"), null);
});
