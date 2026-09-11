"use server";

import { and, eq, ilike } from "drizzle-orm";

import { db } from "@/db/client";
import { events, goals, habits, readingItems, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

export type SearchResultType = "task" | "habit" | "goal" | "event" | "reading";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
}

const RESULTS_PER_TYPE = 5;

const TYPE_LABELS: Record<SearchResultType, string> = {
  task: "Tarefa",
  habit: "Hábito",
  goal: "Objetivo",
  event: "Evento",
  reading: "Leitura",
};

/**
 * Busca global (Cmd/Ctrl+K) — procura só nos itens do PRÓPRIO usuário (não
 * itens compartilhados com ele, pra manter a consulta simples). Não existe
 * página de detalhe por item no app (tudo é lista + modal), então o
 * resultado sempre leva pra tela da lista, não pro item em si.
 */
export async function searchEverythingAction(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const userId = await requireUserId();
  const pattern = `%${trimmed}%`;

  const [taskRows, habitRows, goalRows, eventRows, readingRows] = await Promise.all([
    db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), ilike(tasks.title, pattern)))
      .limit(RESULTS_PER_TYPE),
    db
      .select({ id: habits.id, title: habits.title })
      .from(habits)
      .where(and(eq(habits.userId, userId), ilike(habits.title, pattern)))
      .limit(RESULTS_PER_TYPE),
    db
      .select({ id: goals.id, title: goals.title })
      .from(goals)
      .where(and(eq(goals.userId, userId), ilike(goals.title, pattern)))
      .limit(RESULTS_PER_TYPE),
    db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(and(eq(events.userId, userId), ilike(events.title, pattern)))
      .limit(RESULTS_PER_TYPE),
    db
      .select({ id: readingItems.id, title: readingItems.title })
      .from(readingItems)
      .where(and(eq(readingItems.userId, userId), ilike(readingItems.title, pattern)))
      .limit(RESULTS_PER_TYPE),
  ]);

  return [
    ...taskRows.map((row) => toResult(row, "task", "/home/tasks")),
    ...habitRows.map((row) => toResult(row, "habit", "/home/habits")),
    ...goalRows.map((row) => toResult(row, "goal", "/home/goals")),
    ...eventRows.map((row) => toResult(row, "event", "/home/event")),
    ...readingRows.map((row) => toResult(row, "reading", "/home/reading")),
  ];
}

function toResult(row: { id: string; title: string }, type: SearchResultType, href: string): SearchResult {
  return { id: row.id, type, title: row.title, subtitle: TYPE_LABELS[type], href };
}
