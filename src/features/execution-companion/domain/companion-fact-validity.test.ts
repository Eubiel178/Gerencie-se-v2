import assert from "node:assert/strict";
import test from "node:test";

import type { ITask } from "@/features/tasks/domain";

import { isFactStillValid } from "./companion-fact-validity";

function makeTask(overrides: Partial<ITask> = {}): ITask {
  return {
    id: "task-1",
    userId: "user-1",
    tag: "work",
    title: "Estudar React",
    description: "",
    priority: "media",
    completed: false,
    steps: [],
    recurrence: "none",
    syncEnabled: false,
    syncStatus: "NONE",
    isSharedWithMe: false,
    ...overrides,
  };
}

test("isFactStillValid: execution-started deixa de ser válido se a tarefa foi apagada", () => {
  assert.equal(isFactStillValid({ kind: "execution-started", taskTitle: "Estudar React" }, null), false);
});

test("isFactStillValid: execution-started deixa de ser válido se a tarefa já foi concluída nesse meio-tempo", () => {
  const task = makeTask({ completed: true });
  assert.equal(isFactStillValid({ kind: "execution-started", taskTitle: "Estudar React" }, task), false);
});

test("isFactStillValid: execution-completed só continua válido se a tarefa AINDA está concluída", () => {
  const stillCompleted = makeTask({ completed: true });
  const reopened = makeTask({ completed: false });

  assert.equal(isFactStillValid({ kind: "execution-completed", taskTitle: "Estudar React" }, stillCompleted), true);
  assert.equal(isFactStillValid({ kind: "execution-completed", taskTitle: "Estudar React" }, reopened), false);
});

test("isFactStillValid: presence-greeting sem tarefa citada é sempre válido", () => {
  assert.equal(isFactStillValid({ kind: "presence-greeting", taskTitle: null, firstName: null }, null), true);
});

test("isFactStillValid: progress-milestone continua válido mesmo que o estado atual tenha mudado (é um fato do passado)", () => {
  const task = makeTask({ completed: true });
  assert.equal(
    isFactStillValid({ kind: "progress-milestone", taskTitle: "Estudar React", completedSteps: 2, totalSteps: 3 }, task),
    true
  );
});

test("isFactStillValid: ask-quiet-check é sempre válido (não depende de nenhuma tarefa)", () => {
  assert.equal(isFactStillValid({ kind: "ask-quiet-check" }, null), true);
});
