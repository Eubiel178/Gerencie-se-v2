import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { executionSessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

import type { IExecutionSession } from "../domain/types";

function mapSessionRow(row: typeof executionSessions.$inferSelect): IExecutionSession {
  return {
    id: row.id,
    userId: row.userId,
    taskId: row.taskId,
    status: row.status as IExecutionSession["status"],
    currentStepIndex: row.currentStepIndex,
    startedAt: row.startedAt,
    pausedAt: row.pausedAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt,
    lastCheckinSentAt: row.lastCheckinSentAt,
  };
}

export class LocalExecutionSession {
  async getActive(): Promise<IExecutionSession | null> {
    const userId = await requireUserId();
    const [row] = await db
      .select()
      .from(executionSessions)
      .where(
        and(
          eq(executionSessions.userId, userId),
          eq(executionSessions.status, "active")
        )
      )
      .limit(1);

    return row ? mapSessionRow(row) : null;
  }

  async getActiveOrPaused(): Promise<IExecutionSession | null> {
    const userId = await requireUserId();
    const [row] = await db
      .select()
      .from(executionSessions)
      .where(
        and(
          eq(executionSessions.userId, userId),
          eq(executionSessions.status, "active")
        )
      )
      .limit(1);

    if (row) return mapSessionRow(row);

    const [pausedRow] = await db
      .select()
      .from(executionSessions)
      .where(
        and(
          eq(executionSessions.userId, userId),
          eq(executionSessions.status, "paused")
        )
      )
      .limit(1);

    return pausedRow ? mapSessionRow(pausedRow) : null;
  }

  async getById(id: string): Promise<IExecutionSession | null> {
    const userId = await requireUserId();
    const [row] = await db
      .select()
      .from(executionSessions)
      .where(
        and(
          eq(executionSessions.id, id),
          eq(executionSessions.userId, userId)
        )
      )
      .limit(1);

    return row ? mapSessionRow(row) : null;
  }

  async create(params: { taskId: string }): Promise<IExecutionSession> {
    const userId = await requireUserId();
    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(executionSessions).values({
      id,
      userId,
      taskId: params.taskId,
      status: "active",
      currentStepIndex: 0,
      startedAt: now,
      updatedAt: now,
    });

    const row = await this.getById(id);
    return row!;
  }

  async updateStepIndex(id: string, stepIndex: number): Promise<void> {
    const userId = await requireUserId();
    await db
      .update(executionSessions)
      .set({
        currentStepIndex: stepIndex,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(executionSessions.id, id),
          eq(executionSessions.userId, userId)
        )
      );
  }

  async pause(id: string): Promise<void> {
    const userId = await requireUserId();
    await db
      .update(executionSessions)
      .set({
        status: "paused",
        pausedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(executionSessions.id, id),
          eq(executionSessions.userId, userId)
        )
      );
  }

  async resume(id: string): Promise<void> {
    const userId = await requireUserId();
    await db
      .update(executionSessions)
      .set({
        status: "active",
        pausedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(executionSessions.id, id),
          eq(executionSessions.userId, userId)
        )
      );
  }

  async complete(id: string): Promise<void> {
    const userId = await requireUserId();
    await db
      .update(executionSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(executionSessions.id, id),
          eq(executionSessions.userId, userId)
        )
      );
  }

  async abandon(id: string): Promise<void> {
    const userId = await requireUserId();
    await db
      .update(executionSessions)
      .set({
        status: "abandoned",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(executionSessions.id, id),
          eq(executionSessions.userId, userId)
        )
      );
  }
}

let cachedRepo: LocalExecutionSession | null = null;

export function getExecutionSessionFetcher(): LocalExecutionSession {
  if (!cachedRepo) cachedRepo = new LocalExecutionSession();
  return cachedRepo;
}
