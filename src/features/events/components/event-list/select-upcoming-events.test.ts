import assert from "node:assert/strict";
import test from "node:test";

import { selectUpcomingEvents } from "./select-upcoming-events";

const NOW = new Date("2026-09-21T12:00:00");

function event(overrides: Partial<Parameters<typeof selectUpcomingEvents>[0][number]>) {
  return {
    id: crypto.randomUUID(),
    userId: "u1",
    title: "Evento",
    description: "",
    start: "2026-09-21T13:00",
    ...overrides,
  };
}

test("selectUpcomingEvents: remove eventos que já terminaram", () => {
  const past = event({ start: "2026-09-20T10:00" });
  const future = event({ start: "2026-09-22T10:00" });
  const result = selectUpcomingEvents([past, future], NOW);

  assert.deepEqual(result.map((e) => e.id), [future.id]);
});

test("selectUpcomingEvents: evento em andamento (start passado, end futuro) continua próximo", () => {
  const ongoing = event({ start: "2026-09-21T11:00", end: "2026-09-21T14:00" });
  const result = selectUpcomingEvents([ongoing], NOW);

  assert.equal(result.length, 1);
});

test("selectUpcomingEvents: ordena do mais próximo pro mais distante", () => {
  const later = event({ title: "later", start: "2026-09-25T10:00" });
  const sooner = event({ title: "sooner", start: "2026-09-22T10:00" });
  const result = selectUpcomingEvents([later, sooner], NOW);

  assert.deepEqual(result.map((e) => e.title), ["sooner", "later"]);
});

test("selectUpcomingEvents: lista vazia retorna vazio", () => {
  assert.deepEqual(selectUpcomingEvents([], NOW), []);
});
