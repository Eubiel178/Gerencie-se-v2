import assert from "node:assert/strict";
import test from "node:test";

import { COMPANION_ACTIONS, getCompanionAction, getAllCompanionActions } from "./actions";

// ── Registry ──

test("action registry: contém 6 ações", () => {
  const actions = getAllCompanionActions();
  assert.equal(actions.length, 6);
});

test("action registry: todas as ações são conhecidas", () => {
  assert.ok(getCompanionAction("task.create"));
  assert.ok(getCompanionAction("task.complete"));
  assert.ok(getCompanionAction("task.update"));
  assert.ok(getCompanionAction("task.updateDueDate"));
  assert.ok(getCompanionAction("task.addStep"));
  assert.ok(getCompanionAction("task.startExecution"));
});

test("action registry: ação desconhecida retorna undefined", () => {
  assert.equal(getCompanionAction("task.delete"), undefined);
  assert.equal(getCompanionAction("user.login"), undefined);
  assert.equal(getCompanionAction(""), undefined);
});

// ── Risk levels ──

test("task.create: risk=medium, requiresConfirmation=true", () => {
  const action = getCompanionAction("task.create")!;
  assert.equal(action.risk, "medium");
  assert.equal(action.requiresConfirmation, true);
});

test("task.complete: risk=medium, requiresConfirmation=true", () => {
  const action = getCompanionAction("task.complete")!;
  assert.equal(action.risk, "medium");
  assert.equal(action.requiresConfirmation, true);
});

test("task.updateDueDate: risk=medium, requiresConfirmation=true", () => {
  const action = getCompanionAction("task.updateDueDate")!;
  assert.equal(action.risk, "medium");
  assert.equal(action.requiresConfirmation, true);
});

test("task.update: risk=medium, requiresConfirmation=true", () => {
  const action = getCompanionAction("task.update")!;
  assert.equal(action.risk, "medium");
  assert.equal(action.requiresConfirmation, true);
});

test("task.addStep: risk=low, requiresConfirmation=false", () => {
  const action = getCompanionAction("task.addStep")!;
  assert.equal(action.risk, "low");
  assert.equal(action.requiresConfirmation, false);
});

test("task.startExecution: risk=low, requiresConfirmation=false", () => {
  const action = getCompanionAction("task.startExecution")!;
  assert.equal(action.risk, "low");
  assert.equal(action.requiresConfirmation, false);
});

// ── Schema validation ──

test("task.create schema: aceita dados válidos", () => {
  const action = getCompanionAction("task.create")!;
  const result = action.paramsSchema.safeParse({ title: "Nova tarefa" });
  assert.ok(result.success);
});

test("task.create schema: rejeita título vazio", () => {
  const action = getCompanionAction("task.create")!;
  const result = action.paramsSchema.safeParse({ title: "" });
  assert.ok(!result.success);
});

test("task.create schema: aceita com todos os campos", () => {
  const action = getCompanionAction("task.create")!;
  const result = action.paramsSchema.safeParse({
    title: "Estudar React",
    description: "LER docs",
    tag: "studie",
    priority: "alta",
    scheduledAt: "2026-01-01",
  });
  assert.ok(result.success);
});

test("task.create schema: tag inválida é rejeitada", () => {
  const action = getCompanionAction("task.create")!;
  const result = action.paramsSchema.safeParse({ title: "Teste", tag: "invalid" });
  assert.ok(!result.success);
});

test("task.create schema: tag válida é aceita", () => {
  const action = getCompanionAction("task.create")!;
  const result = action.paramsSchema.safeParse({ title: "Teste", tag: "work" });
  assert.ok(result.success);
});

test("task.complete schema: aceita taskId", () => {
  const action = getCompanionAction("task.complete")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc-123" });
  assert.ok(result.success);
});

test("task.complete schema: rejeita taskId vazio", () => {
  const action = getCompanionAction("task.complete")!;
  const result = action.paramsSchema.safeParse({ taskId: "" });
  assert.ok(!result.success);
});

test("task.complete schema: rejeita sem taskId", () => {
  const action = getCompanionAction("task.complete")!;
  const result = action.paramsSchema.safeParse({});
  assert.ok(!result.success);
});

test("task.updateDueDate schema: aceita taskId + scheduledAt", () => {
  const action = getCompanionAction("task.updateDueDate")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc", scheduledAt: "2026-01-01" });
  assert.ok(result.success);
});

test("task.updateDueDate schema: rejeita sem scheduledAt", () => {
  const action = getCompanionAction("task.updateDueDate")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc" });
  assert.ok(!result.success);
});

test("task.addStep schema: aceita taskId + title", () => {
  const action = getCompanionAction("task.addStep")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc", title: "Novo passo" });
  assert.ok(result.success);
});

test("task.addStep schema: rejeita title vazio", () => {
  const action = getCompanionAction("task.addStep")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc", title: "" });
  assert.ok(!result.success);
});

test("task.startExecution schema: aceita taskId", () => {
  const action = getCompanionAction("task.startExecution")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc" });
  assert.ok(result.success);
});

test("task.update schema: aceita taskId + campos parciais", () => {
  const action = getCompanionAction("task.update")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc", title: "Novo título" });
  assert.ok(result.success);
});

test("task.update schema: aceita todos os campos", () => {
  const action = getCompanionAction("task.update")!;
  const result = action.paramsSchema.safeParse({
    taskId: "abc",
    title: "Tarefa",
    description: "Desc",
    priority: "alta",
    scheduledAt: "2026-01-01",
    tag: "work",
  });
  assert.ok(result.success);
});

test("task.update schema: aceita sem nenhum campo adicional (só taskId)", () => {
  const action = getCompanionAction("task.update")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc" });
  assert.ok(result.success);
});

test("task.update schema: rejeita taskId vazio", () => {
  const action = getCompanionAction("task.update")!;
  const result = action.paramsSchema.safeParse({ taskId: "" });
  assert.ok(!result.success);
});

test("task.update schema: rejeita sem taskId", () => {
  const action = getCompanionAction("task.update")!;
  const result = action.paramsSchema.safeParse({ title: "Tarefa" });
  assert.ok(!result.success);
});

test("task.update schema: priority inválida é rejeitada", () => {
  const action = getCompanionAction("task.update")!;
  const result = action.paramsSchema.safeParse({ taskId: "abc", priority: "invalid" });
  assert.ok(!result.success);
});

// ── Todas as ações têm name e description ──

test("todas as ações têm name e description", () => {
  for (const action of getAllCompanionActions()) {
    assert.ok(action.name.length > 0, `${action.name} deve ter name`);
    assert.ok(action.description.length > 0, `${action.name} deve ter description`);
  }
});

// ── Todas as ações têm risk válido ──

test("todas as ações têm risk válido", () => {
  const validRisks = ["low", "medium", "high"];
  for (const action of getAllCompanionActions()) {
    assert.ok(validRisks.includes(action.risk), `${action.name} risk inválido: ${action.risk}`);
  }
});
