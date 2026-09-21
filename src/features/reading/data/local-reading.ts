import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { readingItems } from "@/db/schema";
import * as domain from "@/features/reading/domain";
import { requireUserId } from "@/lib/auth";

/**
 * Decide o valor de `finishedAt` a persistir com base no status resultante
 * e no finishedAt já existente. Sempre é idempotente: marcar como
 * "finished" duas vezes seguidas não altera o timestamp original; desmarcar
 * e remarcar mantém o instante da primeira conclusão real.
 */
function resolveFinishedAt(params: {
  status: domain.ReadingStatus;
  existingFinishedAt: Date | null;
  nextFinishedAt?: Date | null;
}): Date | null {
  if (params.status !== "finished") return null;
  if (params.nextFinishedAt !== undefined) return params.nextFinishedAt;
  return params.existingFinishedAt ?? new Date();
}

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

    const status =
      params.totalPages != null && params.currentPage != null && params.currentPage === params.totalPages
        ? "finished"
        : params.totalPages != null && params.currentPage != null && params.currentPage > 0
          ? "reading"
        : "want_to_read";

    const [row] = await db.insert(readingItems).values({
      id,
      userId,
      title: params.title,
      author: params.author || null,
      totalPages: params.totalPages ?? null,
      currentPage: params.currentPage ?? null,
      dailyReadingGoal: params.dailyReadingGoal ?? null,
      status,
      finishedAt: status === "finished" ? new Date() : null,
    }).returning();

    return mapRowToReadingItem(row);
  }

  async update(params: domain.UpdateReadingItem.Params) {
    const userId = await requireUserId();
    const [item] = await db
      .select({
        totalPages: readingItems.totalPages,
        currentPage: readingItems.currentPage,
        finishedAt: readingItems.finishedAt,
      })
      .from(readingItems)
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)));

    const completingTrackedItem = params.status === "finished" && item?.totalPages != null;

    const [row] = await db
      .update(readingItems)
      .set({
        status: params.status,
        progressPercent: params.progressPercent,
        currentPage: completingTrackedItem ? item.totalPages : undefined,
        finishedAt: resolveFinishedAt({
          status: params.status,
          existingFinishedAt: item?.finishedAt ?? null,
        }),
      })
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)))
      .returning();

    return row ? mapRowToReadingItem(row) : null;
  }

  async updateDetails(params: domain.UpdateReadingDetails.Params) {
    const userId = await requireUserId();
    const [existing] = await db
      .select({
        progressPercent: readingItems.progressPercent,
        finishedAt: readingItems.finishedAt,
      })
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
        finishedAt: resolveFinishedAt({
          status: derivedStatus,
          existingFinishedAt: existing.finishedAt ?? null,
        }),
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
      .select({
        totalPages: readingItems.totalPages,
        finishedAt: readingItems.finishedAt,
      })
      .from(readingItems)
      .where(and(eq(readingItems.id, params.id), eq(readingItems.userId, userId)));

    if (!item) return { status: "not-found" };
    if (item.totalPages == null) return { status: "total-pages-required" };
    if (params.currentPage > item.totalPages) return { status: "page-exceeds-total" };

    const isFinished = params.currentPage === item.totalPages;

    const [row] = await db
      .update(readingItems)
      .set({
        currentPage: params.currentPage,
        status: isFinished ? "finished" : "reading",
        finishedAt: resolveFinishedAt({
          status: isFinished ? "finished" : "reading",
          existingFinishedAt: item.finishedAt ?? null,
        }),
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
    finishedAt: row.finishedAt,
    addedAt: row.addedAt,
  };
}