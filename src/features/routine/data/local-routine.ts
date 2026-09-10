import "server-only";

import { and, asc, eq } from "drizzle-orm";

import * as domain from "@/features/routine/domain";

import { db } from "@/db/client";
import { routineItems } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de RoutineItem.
 *
 * Segue o mesmo padrão de `LocalTask`/`LocalEvent`: só pode ser usada no
 * servidor, consumida exclusivamente pelas Server Actions em
 * `src/features/routine/actions.ts` e pelo Server Component da página de
 * Rotina.
 */
export class LocalRoutineItem
  implements
    domain.CreateRoutineItem,
    domain.LoadAllRoutineItems,
    domain.UpdateRoutineItem,
    domain.DeleteRoutineItem
{
  async create(params: domain.CreateRoutineItem.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(routineItems).values({
      id,
      userId,
      time: params.time,
      title: params.title,
      taskId: params.taskId || null,
    });

    return { id };
  }

  /** Sempre ordenado por horário — é assim que a rotina faz sentido de ler
   * (um dia típico do início ao fim), nunca por ordem de criação. */
  async loadAll(): Promise<domain.LoadAllRoutineItems.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(routineItems)
      .where(eq(routineItems.userId, userId))
      .orderBy(asc(routineItems.time));

    return rows.map(mapRowToRoutineItem);
  }

  async update(params: domain.UpdateRoutineItem.Params) {
    const userId = await requireUserId();

    await db
      .update(routineItems)
      .set({
        time: params.time,
        title: params.title,
        taskId: params.taskId || null,
      })
      .where(and(eq(routineItems.id, params.id), eq(routineItems.userId, userId)));
  }

  async delete(params: domain.DeleteRoutineItem.Params) {
    const userId = await requireUserId();

    await db
      .delete(routineItems)
      .where(and(eq(routineItems.id, params.id), eq(routineItems.userId, userId)));
  }
}

function mapRowToRoutineItem(row: typeof routineItems.$inferSelect): domain.IRoutineItem {
  return {
    id: row.id,
    userId: row.userId,
    time: row.time,
    title: row.title,
    taskId: row.taskId,
    createdAt: row.createdAt,
  };
}
