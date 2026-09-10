import "server-only";

import { and, eq } from "drizzle-orm";

import * as domain from "@/features/reading/domain";

import { db } from "@/db/client";
import { readingItems } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

export class LocalReading
  implements
    domain.CreateReadingItem,
    domain.UpdateReadingItem,
    domain.DeleteReadingItem,
    domain.LoadAllReadingItems
{
  async create(params: domain.CreateReadingItem.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(readingItems).values({
      id,
      userId,
      title: params.title,
      author: params.author || null,
    });

    return { id };
  }

  async update(params: domain.UpdateReadingItem.Params) {
    const userId = await requireUserId();

    await db
      .update(readingItems)
      .set({
        status: params.status,
        progressPercent: params.progressPercent,
      })
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)));
  }

  async delete(params: domain.DeleteReadingItem.Params) {
    const userId = await requireUserId();

    await db
      .delete(readingItems)
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)));
  }

  async loadAll(): Promise<domain.LoadAllReadingItems.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(readingItems)
      .where(eq(readingItems.userId, userId));

    return rows.map(mapRowToReadingItem);
  }
}

function mapRowToReadingItem(row: typeof readingItems.$inferSelect): domain.IReadingItem {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    author: row.author,
    status: row.status,
    progressPercent: row.progressPercent,
    addedAt: row.addedAt,
  };
}
