import "server-only";

import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";

import * as domain from "@/features/health/domain";

import { db } from "@/db/client";
import { healthCheckups } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

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

    await db.insert(healthCheckups).values({
      id,
      userId,
      title: params.title,
      category: params.category,
      intervalDays: params.intervalDays ?? null,
      notes: params.notes ?? null,
    });

    return { id };
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

    await db
      .update(healthCheckups)
      .set({ lastDoneAt: dayjs().format("YYYY-MM-DD") })
      .where(and(eq(healthCheckups.id, params.id), eq(healthCheckups.userId, userId)));
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
  let nextDueDate: string | null = null;
  let isOverdue = false;

  if (row.lastDoneAt && row.intervalDays) {
    const due = dayjs(row.lastDoneAt).add(row.intervalDays, "day");
    nextDueDate = due.format("YYYY-MM-DD");
    isOverdue = due.isBefore(dayjs(), "day");
  }

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
