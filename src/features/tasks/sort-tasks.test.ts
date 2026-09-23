import assert from "node:assert/strict";
import test from "node:test";

import { sortTasksByPriority } from "./sort-tasks";

test("sortTasksByPriority: critica primeiro, baixa por ultimo", () => {
  const tasks = [
    { priority: "baixa" as const, title: "b" },
    { priority: "critica" as const, title: "c" },
    { priority: "media" as const, title: "m" },
    { priority: "alta" as const, title: "a" },
  ];

  const sorted = sortTasksByPriority(tasks).map((task) => task.title);
  assert.deepEqual(sorted, ["c", "a", "m", "b"]);
});

test("sortTasksByPriority: empate mantem a ordem original (sort estavel)", () => {
  const tasks = [
    { priority: "alta" as const, title: "primeira alta" },
    { priority: "baixa" as const, title: "baixa" },
    { priority: "alta" as const, title: "segunda alta" },
  ];

  const sorted = sortTasksByPriority(tasks).map((task) => task.title);
  assert.deepEqual(sorted, ["primeira alta", "segunda alta", "baixa"]);
});

test("sortTasksByPriority: nao muda a lista original", () => {
  const tasks = [
    { priority: "baixa" as const, title: "b" },
    { priority: "alta" as const, title: "a" },
  ];

  sortTasksByPriority(tasks);
  assert.equal(tasks[0].title, "b");
});
