import assert from "node:assert/strict";
import test from "node:test";

import { computeDueReminders, reminderSentKey } from "./due-reminders";

const NOW = new Date("2026-09-14T10:00:00");

function buildTask(overrides: Partial<Parameters<typeof computeDueReminders>[0][number]> = {}) {
  return {
    id: "t1",
    userId: "u1",
    title: "Tarefa",
    scheduledAt: "2026-09-14T10:05:00",
    reminderOffsetsMinutes: [5],
    ...overrides,
  };
}

test("computeDueReminders: dispara quando o horário do lembrete já passou", () => {
  const due = computeDueReminders([buildTask()], new Set(), NOW);
  assert.equal(due.length, 1);
  assert.deepEqual(due[0], { taskId: "t1", userId: "u1", title: "Tarefa", offsetMinutes: 5 });
});

test("computeDueReminders: não dispara antes da hora", () => {
  const due = computeDueReminders(
    [buildTask({ scheduledAt: "2026-09-14T12:00:00", reminderOffsetsMinutes: [5] })],
    new Set(),
    NOW
  );
  assert.equal(due.length, 0);
});

test("computeDueReminders: não dispara de novo se já foi enviado", () => {
  const alreadySent = new Set([reminderSentKey("t1", 5)]);
  const due = computeDueReminders([buildTask()], alreadySent, NOW);
  assert.equal(due.length, 0);
});

test("computeDueReminders: ignora lembrete velho demais (cron ficou fora do ar)", () => {
  const due = computeDueReminders(
    [buildTask({ scheduledAt: "2026-09-14T06:00:00", reminderOffsetsMinutes: [0] })],
    new Set(),
    NOW
  );
  assert.equal(due.length, 0);
});

test("computeDueReminders: cada offset da mesma tarefa é avaliado separadamente", () => {
  const due = computeDueReminders(
    [buildTask({ scheduledAt: "2026-09-14T10:05:00", reminderOffsetsMinutes: [5, 1440] })],
    new Set(),
    NOW
  );
  assert.equal(due.length, 1);
  assert.equal(due[0].offsetMinutes, 5);
});
