import assert from "node:assert/strict";
import test from "node:test";

import { ITask } from "@/features/tasks/domain";

import { buildNextAction } from "./next-action";

function task(overrides: Partial<ITask>): ITask {
  return {
    id: "t1",
    userId: "u1",
    title: "Tarefa",
    description: "",
    tag: "",
    priority: "media",
    completed: false,
    scheduledAt: undefined,
    reminderOffsetsMinutes: [],
    recurrence: "none",
    startedAt: null,
    sharedWithUserId: null,
    isSharedWithMe: false,
    syncEnabled: false,
    syncStatus: "NONE",
    steps: [],
    ...overrides,
  };
}

test("buildNextAction: tarefa ja comecada vence ate uma atrasada (retomar custa menos que trocar de contexto)", () => {
  const tasks = [
    task({ id: "atrasada", title: "Atrasada", scheduledAt: "2020-01-01T00:00:00.000Z" }),
    task({ id: "comecada", title: "Em andamento", startedAt: new Date("2020-01-01T00:00:00.000Z") }),
  ];

  const action = buildNextAction({ tasks, routine: [], habits: [] });

  assert.equal(action.kind, "resumed");
  assert.equal(action.title, "Em andamento");
});

test("buildNextAction: entre duas comecadas, retoma a mais recente", () => {
  const tasks = [
    task({ id: "mais-antiga", title: "Antiga", startedAt: new Date("2020-01-01T00:00:00.000Z") }),
    task({ id: "mais-recente", title: "Recente", startedAt: new Date("2020-06-01T00:00:00.000Z") }),
  ];

  const action = buildNextAction({ tasks, routine: [], habits: [] });

  assert.equal(action.title, "Recente");
});

test("buildNextAction: sem tarefa comecada, cai pra atrasada normalmente", () => {
  const tasks = [task({ id: "atrasada", title: "Atrasada", scheduledAt: "2020-01-01T00:00:00.000Z" })];

  const action = buildNextAction({ tasks, routine: [], habits: [] });

  assert.equal(action.kind, "overdue");
});

test("buildNextAction: tarefa pendente prioridade media/sem horario ainda conta como próxima ação (achado: caía direto em 'Tudo em dia')", () => {
  const tasks = [task({ id: "solta", title: "Despejo mental", priority: "media" })];

  const action = buildNextAction({ tasks, routine: [], habits: [] });

  assert.equal(action.kind, "priority");
  assert.equal(action.label, "Tarefa pendente");
  assert.equal(action.title, "Despejo mental");
});

test("buildNextAction: prioridade alta/critica continua com o rótulo 'Prioridade alta'", () => {
  const tasks = [task({ id: "alta", title: "Urgente", priority: "critica" })];

  const action = buildNextAction({ tasks, routine: [], habits: [] });

  assert.equal(action.kind, "priority");
  assert.equal(action.label, "Prioridade alta");
});

test("buildNextAction: sem nenhuma tarefa/hábito/rotina pendente, 'Tudo em dia' de verdade", () => {
  const action = buildNextAction({ tasks: [], routine: [], habits: [] });

  assert.equal(action.kind, "none");
});
