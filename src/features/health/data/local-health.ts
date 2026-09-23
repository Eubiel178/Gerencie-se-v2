import "server-only";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";


import { db } from "@/db/client";
import { healthCheckups } from "@/db/schema";
import * as domain from "@/features/health/domain";
import { requireUserId } from "@/lib/auth";

export class LocalHealth
  implements
    domain.CreateHealthCheckup,
    domain.UpdateHealthCheckup,
    domain.DeleteHealthCheckup,
    domain.LoadAllHealthCheckups,
    domain.MarkHealthCheckupDone
{
  async create(params: domain.CreateHealthCheckup.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    const [row] = await db.insert(healthCheckups).values({
      id,
      userId,
      title: params.title,
      category: params.category,
      intervalDays: params.intervalDays ?? null,
      notes: params.notes ?? null,
    }).returning();

    return mapRowToCheckup(row);
  }

  async update(params: domain.UpdateHealthCheckup.Params) {
    const userId = await requireUserId();

    await db
      .update(healthCheckups)
      .set({
        title: params.title,
        category: params.category,
        intervalDays: params.intervalDays ?? null,
        notes: params.notes ?? null,
      })
      .where(and(eq(healthCheckups.id, params.id), eq(healthCheckups.userId, userId)));
  }

  async markDone(params: domain.MarkHealthCheckupDone.Params) {
    const userId = await requireUserId();
    const lastDoneAt = dayjs().format("YYYY-MM-DD");

    await db
      .update(healthCheckups)
      .set({ lastDoneAt })
      .where(and(eq(healthCheckups.id, params.id), eq(healthCheckups.userId, userId)));

    return { lastDoneAt };
  }

  async delete(params: domain.DeleteHealthCheckup.Params) {
    const userId = await requireUserId();

    await db
      .delete(healthCheckups)
      .where(and(eq(healthCheckups.id, params.id), eq(healthCheckups.userId, userId)));
  }

  async loadAll(): Promise<domain.LoadAllHealthCheckups.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(healthCheckups)
      .where(eq(healthCheckups.userId, userId));

    return rows.map(mapRowToCheckup);
  }
}

function mapRowToCheckup(row: typeof healthCheckups.$inferSelect): domain.IHealthCheckup {
  const { nextDueDate, isOverdue } = domain.computeCheckupDueState(row.lastDoneAt, row.intervalDays);

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    category: row.category,
    intervalDays: row.intervalDays,
    lastDoneAt: row.lastDoneAt,
    notes: row.notes,
    nextDueDate,
    isOverdue,
  };
}
