import "server-only";

import { and, desc, eq } from "drizzle-orm";


import { db } from "@/db/client";
import { menstrualCycleEntries } from "@/db/schema";
import * as domain from "@/features/menstrual-cycle/domain";
import { requireUserId } from "@/lib/auth";

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

    return { entries, estimate: domain.calculateCycleEstimate(entries) };
  }
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
