import assert from "node:assert/strict";
import test from "node:test";

import { useTaskStore } from "./task-store";

const task = {
  id: "task-1", userId: "user-1", tag: "work", title: "Planejar", description: "Semana",
  priority: "media" as const, completed: false, syncEnabled: false, syncStatus: "NONE" as const,
  recurrence: "none" as const,
};

test("remove uma tarefa do estado compartilhado", () => {
  useTaskStore.getState().setTasks([task]);
  useTaskStore.getState().removeTask(task.id);
  assert.deepEqual(useTaskStore.getState().tasks, []);
});
