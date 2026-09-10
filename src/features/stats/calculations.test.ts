import assert from "node:assert/strict";
import test from "node:test";

import dayjs from "dayjs";

import {
  calculateAverageGoalProgress,
  calculateBestHabitStreak,
  calculateHydrationAdherence,
  calculateTaskStats,
  calculateWeeklyFocusHours,
  calculateWeeklyRunningStats,
} from "./calculations";

const NOW = dayjs("2026-09-10T12:00");

function task(overrides: Partial<Parameters<typeof calculateTaskStats>[0][number]>) {
  return {
    id: "t1",
    userId: "u1",
    tag: "work",
    title: "x",
    description: "",
    priority: "media" as const,
    completed: false,
    syncEnabled: false,
    syncStatus: "NONE" as const,
    recurrence: "none" as const,
    ...overrides,
  };
}

test("calculateTaskStats: conta concluídas na semana, atrasadas e taxa geral", () => {
  const tasks = [
    task({ completed: true, completedAt: NOW.subtract(2, "day").toDate() }),
    task({ completed: true, completedAt: NOW.subtract(10, "day").toDate() }), // fora da janela
    task({ completed: false, scheduledAt: NOW.subtract(1, "hour").format("YYYY-MM-DDTHH:mm") }), // atrasada
    task({ completed: false, scheduledAt: NOW.add(1, "day").format("YYYY-MM-DDTHH:mm") }), // futura, não atrasada
  ];

  const stats = calculateTaskStats(tasks, NOW);
  assert.equal(stats.completedThisWeek, 1);
  assert.equal(stats.overdueCount, 1);
  assert.equal(stats.completionRate, 50); // 2 de 4 concluídas (todas, não só a semana)
});

test("calculateTaskStats: sem tarefas, tudo zerado (sem divisão por zero)", () => {
  assert.deepEqual(calculateTaskStats([], NOW), {
    completedThisWeek: 0,
    overdueCount: 0,
    completionRate: 0,
  });
});

test("calculateWeeklyFocusHours: soma só sessões concluídas dentro da janela", () => {
  const sessions = [
    {
      id: "1",
      userId: "u1",
      startedAt: NOW.subtract(1, "day").toDate(),
      plannedDurationSeconds: 1500,
      actualDurationSeconds: 3600,
      status: "completed" as const,
      xpEarned: 10,
    },
    {
      id: "2",
      userId: "u1",
      startedAt: NOW.subtract(1, "day").toDate(),
      plannedDurationSeconds: 1500,
      actualDurationSeconds: 1800,
      status: "cancelled" as const, // não conta
      xpEarned: 0,
    },
    {
      id: "3",
      userId: "u1",
      startedAt: NOW.subtract(10, "day").toDate(), // fora da janela
      plannedDurationSeconds: 1500,
      actualDurationSeconds: 3600,
      status: "completed" as const,
      xpEarned: 10,
    },
  ];

  assert.equal(calculateWeeklyFocusHours(sessions, NOW), 1);
});

test("calculateHydrationAdherence: conta dias que bateram a meta", () => {
  const week = [
    { date: "1", totalMl: 2000 },
    { date: "2", totalMl: 1500 },
    { date: "3", totalMl: 2500 },
  ];
  assert.equal(calculateHydrationAdherence(week, 2000), 2);
});

test("calculateHydrationAdherence: meta inválida (0) retorna 0", () => {
  assert.equal(calculateHydrationAdherence([{ date: "1", totalMl: 100 }], 0), 0);
});

test("calculateBestHabitStreak: pega o maior entre todos os hábitos", () => {
  assert.equal(
    calculateBestHabitStreak([{ currentStreak: 2 }, { currentStreak: 9 }, { currentStreak: 5 }]),
    9
  );
});

test("calculateAverageGoalProgress: ignora metas arquivadas na média", () => {
  const goals = [
    { progressPercent: 100, archived: true }, // ignorada
    { progressPercent: 50, archived: false },
    { progressPercent: 30, archived: false },
  ];
  assert.equal(calculateAverageGoalProgress(goals), 40);
});

test("calculateAverageGoalProgress: sem metas ativas retorna 0", () => {
  assert.equal(calculateAverageGoalProgress([{ progressPercent: 100, archived: true }]), 0);
});

test("calculateWeeklyRunningStats: soma só corridas dentro da janela de 7 dias", () => {
  const sessions = [
    {
      id: "1",
      userId: "u1",
      startedAt: NOW.subtract(1, "day").toDate(),
      durationSeconds: 1800,
      distanceMeters: 5000,
      source: "manual" as const,
      paceMinPerKm: 6,
      speedKmh: 10,
    },
    {
      id: "2",
      userId: "u1",
      startedAt: NOW.subtract(10, "day").toDate(), // fora da janela
      durationSeconds: 1800,
      distanceMeters: 5000,
      source: "manual" as const,
      paceMinPerKm: 6,
      speedKmh: 10,
    },
  ];

  const result = calculateWeeklyRunningStats(sessions, NOW);
  assert.equal(result.distanceKm, 5);
  assert.equal(result.sessionCount, 1);
});
