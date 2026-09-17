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
    domain.UpdateReadingDetails,
    domain.DeleteReadingItem,
    domain.LoadAllReadingItems
{
  async create(params: domain.CreateReadingItem.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    const [row] = await db.insert(readingItems).values({
      id,
      userId,
      title: params.title,
      author: params.author || null,
      totalPages: params.totalPages ?? null,
      currentPage: params.currentPage ?? null,
      dailyReadingGoal: params.dailyReadingGoal ?? null,
      status:
        params.totalPages != null && params.currentPage != null && params.currentPage === params.totalPages
          ? "finished"
          : params.totalPages != null && params.currentPage != null && params.currentPage > 0
            ? "reading"
          : "want_to_read",
    }).returning();

    return mapRowToReadingItem(row);
  }

  async update(params: domain.UpdateReadingItem.Params) {
    const userId = await requireUserId();
    const [item] = await db
      .select({ totalPages: readingItems.totalPages, currentPage: readingItems.currentPage })
      .from(readingItems)
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)));

    const completingTrackedItem = params.status === "finished" && item?.totalPages != null;

    const [row] = await db
      .update(readingItems)
      .set({
        status: params.status,
        progressPercent: params.progressPercent,
        currentPage: completingTrackedItem ? item.totalPages : undefined,
      })
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)))
      .returning();

    return row ? mapRowToReadingItem(row) : null;
  }

  async updateDetails(params: domain.UpdateReadingDetails.Params) {
    const userId = await requireUserId();
    const [existing] = await db
      .select({ progressPercent: readingItems.progressPercent })
      .from(readingItems)
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)));

    if (!existing) return null;

    const currentPage = params.totalPages != null && params.status === "finished"
      ? params.totalPages
      : params.currentPage;
    let derivedStatus = params.status;
    let progressPercent = derivedStatus === "finished" ? 100 : existing.progressPercent;

    if (params.totalPages != null && currentPage != null) {
      derivedStatus = currentPage === params.totalPages
        ? "finished"
        : currentPage > 0
          ? "reading"
          : params.status;
      progressPercent = Math.round((currentPage / params.totalPages) * 100);
    }

    const [row] = await db
      .update(readingItems)
      .set({
        title: params.title,
        author: params.author || null,
        status: derivedStatus,
        totalPages: params.totalPages ?? null,
        currentPage: params.totalPages == null ? null : currentPage ?? 0,
        dailyReadingGoal: params.dailyReadingGoal ?? null,
        progressPercent,
      })
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)))
      .returning();

    return row ? mapRowToReadingItem(row) : null;
  }

  async updateCurrentPage(
    params: domain.UpdateReadingCurrentPage.Params
  ): Promise<domain.UpdateReadingCurrentPage.Result> {
    const userId = await requireUserId();
    const [item] = await db
      .select({ totalPages: readingItems.totalPages })
      .from(readingItems)
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)));

    if (!item) return { status: "not-found" };
    if (item.totalPages == null) return { status: "total-pages-required" };
    if (params.currentPage > item.totalPages) return { status: "page-exceeds-total" };

    const [row] = await db
      .update(readingItems)
      .set({
        currentPage: params.currentPage,
        status: params.currentPage === item.totalPages ? "finished" : "reading",
      })
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)))
      .returning();

    return { status: "updated", item: mapRowToReadingItem(row) };
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
    totalPages: row.totalPages,
    currentPage: row.currentPage,
    dailyReadingGoal: row.dailyReadingGoal,
    addedAt: row.addedAt,
  };
}
