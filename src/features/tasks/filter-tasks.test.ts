import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";

import { filterTasks } from "./filter-tasks";

const NOW = dayjs("2026-09-10T12:00");

function task(overrides: Partial<Parameters<typeof filterTasks>[0][number]>) {
  return {
    id: "t1",
    userId: "u1",
    tag: "work",
    title: "Estudar React",
    description: "",
    priority: "media" as const,
    completed: false,
    syncEnabled: false,
    syncStatus: "NONE" as const,
    recurrence: "none" as const,
    isSharedWithMe: false,
    steps: [],
    ...overrides,
  };
}

test("filterTasks: busca por titulo e case-insensitive e por substring", () => {
  const tasks = [task({ title: "Estudar React" }), task({ title: "Lavar louça" })];
  const result = filterTasks(tasks, { searchQuery: "react", statusFilter: "all", priorityFilter: "all" }, NOW);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Estudar React");
});

test("filterTasks: filtro de prioridade", () => {
  const tasks = [task({ priority: "alta" }), task({ priority: "baixa" })];
  const result = filterTasks(tasks, { searchQuery: "", statusFilter: "all", priorityFilter: "alta" }, NOW);

  assert.equal(result.length, 1);
  assert.equal(result[0].priority, "alta");
});

test("filterTasks: status atrasada exige nao concluida e data no passado", () => {
  const tasks = [
    task({ completed: false, scheduledAt: NOW.subtract(1, "day").format("YYYY-MM-DDTHH:mm") }),
    task({ completed: true, scheduledAt: NOW.subtract(1, "day").format("YYYY-MM-DDTHH:mm") }), // concluída, não conta
    task({ completed: false, scheduledAt: NOW.add(1, "day").format("YYYY-MM-DDTHH:mm") }), // futura, não conta
    task({ completed: false }), // sem data, não conta
  ];

  const result = filterTasks(tasks, { searchQuery: "", statusFilter: "overdue", priorityFilter: "all" }, NOW);
  assert.equal(result.length, 1);
});

test("filterTasks: modo de baixa energia esconde alta e critica", () => {
  const tasks = [
    task({ priority: "critica" }),
    task({ priority: "alta" }),
    task({ priority: "media" }),
    task({ priority: "baixa" }),
  ];

  const result = filterTasks(
    tasks,
    { searchQuery: "", statusFilter: "all", priorityFilter: "all", lowEnergyMode: true },
    NOW
  );

  assert.deepEqual(result.map((t) => t.priority), ["media", "baixa"]);
});

test("filterTasks: sem modo de baixa energia mostra todas as prioridades", () => {
  const tasks = [task({ priority: "critica" }), task({ priority: "baixa" })];
  const result = filterTasks(tasks, { searchQuery: "", statusFilter: "all", priorityFilter: "all" }, NOW);

  assert.equal(result.length, 2);
});

test("filterTasks: combina busca, status e prioridade ao mesmo tempo", () => {
  const tasks = [
    task({ title: "Estudar React", priority: "alta", completed: false }),
    task({ title: "Estudar Vue", priority: "alta", completed: true }),
    task({ title: "Estudar React", priority: "baixa", completed: false }),
  ];

  const result = filterTasks(
    tasks,
    { searchQuery: "estudar", statusFilter: "pending", priorityFilter: "alta" },
    NOW
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Estudar React");
  assert.equal(result[0].priority, "alta");
});
