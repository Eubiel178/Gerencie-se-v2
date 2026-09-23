import assert from "node:assert/strict";
import test from "node:test";

import { deriveRoutinePeriod, groupRoutineItemsByPeriod } from "./derive-routine-period";

function item(time: string, id = time) {
  return { id, time, title: id, completedToday: false, isSharedWithMe: false, userId: "u", createdAt: new Date() } as never;
}

test("deriveRoutinePeriod: antes das 12h é manhã", () => {
  assert.equal(deriveRoutinePeriod("07:00"), "manha");
  assert.equal(deriveRoutinePeriod("11:59"), "manha");
});

test("deriveRoutinePeriod: 12h-17h59 é tarde", () => {
  assert.equal(deriveRoutinePeriod("12:00"), "tarde");
  assert.equal(deriveRoutinePeriod("17:59"), "tarde");
});

test("deriveRoutinePeriod: 18h em diante é noite", () => {
  assert.equal(deriveRoutinePeriod("18:00"), "noite");
  assert.equal(deriveRoutinePeriod("23:30"), "noite");
});

test("groupRoutineItemsByPeriod: lista vazia devolve nenhum grupo", () => {
  assert.deepEqual(groupRoutineItemsByPeriod([]), []);
});

test("groupRoutineItemsByPeriod: um único período não vira grupo com cabeçalho", () => {
  const items = [item("07:00"), item("09:00"), item("11:00")];
  const groups = groupRoutineItemsByPeriod(items);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].period, null);
  assert.equal(groups[0].items.length, 3);
});

test("groupRoutineItemsByPeriod: múltiplos períodos viram blocos contíguos", () => {
  const items = [item("07:00"), item("09:00"), item("14:00"), item("20:00")];
  const groups = groupRoutineItemsByPeriod(items);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].period, "manha");
  assert.equal(groups[0].items.length, 2);
  assert.equal(groups[1].period, "tarde");
  assert.equal(groups[1].items.length, 1);
  assert.equal(groups[2].period, "noite");
  assert.equal(groups[2].items.length, 1);
});
