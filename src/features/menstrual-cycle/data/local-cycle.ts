import "server-only";

import dayjs from "dayjs";
import { and, desc, eq } from "drizzle-orm";

import * as domain from "@/features/menstrual-cycle/domain";

import { db } from "@/db/client";
import { menstrualCycleEntries } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

export class LocalCycle
  implements domain.CreateCycleEntry, domain.DeleteCycleEntry, domain.LoadAllCycleEntries
{
  async create(params: domain.CreateCycleEntry.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(menstrualCycleEntries).values({
      id,
      userId,
      startDate: params.startDate,
      periodLengthDays: params.periodLengthDays ?? null,
      symptoms: JSON.stringify(params.symptoms ?? []),
      notes: params.notes ?? null,
    });

    return { id };
  }

  async delete(params: domain.DeleteCycleEntry.Params) {
    const userId = await requireUserId();

    await db
      .delete(menstrualCycleEntries)
      .where(and(eq(menstrualCycleEntries.id, params.id), eq(menstrualCycleEntries.userId, userId)));
  }

  async loadAll(): Promise<domain.LoadAllCycleEntries.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(menstrualCycleEntries)
      .where(eq(menstrualCycleEntries.userId, userId))
      .orderBy(desc(menstrualCycleEntries.startDate));

    const entries = rows.map(mapRowToEntry);

    return { entries, estimate: calculateEstimate(entries) };
  }
}

function calculateEstimate(entries: domain.ICycleEntry[]): domain.ICycleEstimate {
  if (entries.length === 0) {
    return { averageCycleLengthDays: null, nextEstimatedStartDate: null, currentCycleDay: null };
  }

  // `entries` vem mais recente primeiro; precisamos do mais antigo primeiro
  // pra calcular os intervalos entre inícios consecutivos.
  const sortedAsc = [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const gaps: number[] = [];
  for (let i = 1; i < sortedAsc.length; i++) {
    gaps.push(dayjs(sortedAsc[i].startDate).diff(dayjs(sortedAsc[i - 1].startDate), "day"));
  }

  const averageCycleLengthDays =
    gaps.length > 0 ? Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length) : null;

  const lastStart = sortedAsc[sortedAsc.length - 1].startDate;
  const currentCycleDay = dayjs().diff(dayjs(lastStart), "day") + 1;

  const nextEstimatedStartDate = averageCycleLengthDays
    ? dayjs(lastStart).add(averageCycleLengthDays, "day").format("YYYY-MM-DD")
    : null;

  return { averageCycleLengthDays, nextEstimatedStartDate, currentCycleDay };
}

function mapRowToEntry(row: typeof menstrualCycleEntries.$inferSelect): domain.ICycleEntry {
  let symptoms: string[] = [];
  try {
    symptoms = row.symptoms ? JSON.parse(row.symptoms) : [];
  } catch {
    symptoms = [];
  }

  return {
    id: row.id,
    userId: row.userId,
    startDate: row.startDate,
    periodLengthDays: row.periodLengthDays,
    symptoms,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}
