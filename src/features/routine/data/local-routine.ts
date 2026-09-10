import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";

import * as domain from "@/features/routine/domain";

import { db } from "@/db/client";
import { routineItems, users } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { assertAcceptedConnection } from "@/lib/assert-accepted-connection";

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de RoutineItem.
 *
 * Segue o mesmo padrão de `LocalTask`/`LocalEvent`: só pode ser usada no
 * servidor, consumida exclusivamente pelas Server Actions em
 * `src/features/routine/actions.ts` e pelo Server Component da página de
 * Rotina.
 *
 * Compartilhamento (ver `sharedWithUserId` no schema): quem o item foi
 * compartilhado pode ver/editar/concluir, mas só o DONO pode mudar com
 * quem ele está compartilhado ou excluí-lo — ver cada método abaixo.
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

    if (params.sharedWithUserId) {
      await assertAcceptedConnection(userId, params.sharedWithUserId);
    }

    await db.insert(routineItems).values({
      id,
      userId,
      time: params.time,
      title: params.title,
      taskId: params.taskId || null,
      sharedWithUserId: params.sharedWithUserId || null,
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
      .where(or(eq(routineItems.userId, userId), eq(routineItems.sharedWithUserId, userId)))
      .orderBy(asc(routineItems.time));

    const ownerIds = [...new Set(rows.filter((row) => row.userId !== userId).map((row) => row.userId))];

    const owners =
      ownerIds.length === 0
        ? []
        : await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ownerIds));

    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

    return rows.map((row) => mapRowToRoutineItem(row, userId, ownerById.get(row.userId)));
  }

  async update(params: domain.UpdateRoutineItem.Params) {
    const userId = await requireUserId();

    const [existing] = await db
      .select({ userId: routineItems.userId, sharedWithUserId: routineItems.sharedWithUserId })
      .from(routineItems)
      .where(
        and(
          eq(routineItems.id, params.id),
          or(eq(routineItems.userId, userId), eq(routineItems.sharedWithUserId, userId))
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error("Item de rotina não encontrado.");
    }

    // Só o dono pode mudar com quem o item está compartilhado — ver
    // mesmo raciocínio em `LocalTask.update`.
    const isOwner = existing.userId === userId;
    let nextSharedWithUserId = existing.sharedWithUserId;

    if (isOwner && params.sharedWithUserId !== existing.sharedWithUserId) {
      if (params.sharedWithUserId) {
        await assertAcceptedConnection(userId, params.sharedWithUserId);
      }
      nextSharedWithUserId = params.sharedWithUserId || null;
    }

    await db
      .update(routineItems)
      .set({
        time: params.time,
        title: params.title,
        taskId: params.taskId || null,
        sharedWithUserId: nextSharedWithUserId,
      })
      .where(
        and(
          eq(routineItems.id, params.id),
          or(eq(routineItems.userId, userId), eq(routineItems.sharedWithUserId, userId))
        )
      );
  }

  /** Só o DONO pode excluir — compartilhamento dá acesso de ajudar, nunca
   * de apagar o que é do outro. */
  async delete(params: domain.DeleteRoutineItem.Params) {
    const userId = await requireUserId();

    await db
      .delete(routineItems)
      .where(and(eq(routineItems.id, params.id), eq(routineItems.userId, userId)));
  }
}

function mapRowToRoutineItem(
  row: typeof routineItems.$inferSelect,
  viewerId: string,
  owner?: { name: string | null; email: string | null }
): domain.IRoutineItem {
  return {
    id: row.id,
    userId: row.userId,
    time: row.time,
    title: row.title,
    taskId: row.taskId,
    createdAt: row.createdAt,
    sharedWithUserId: row.sharedWithUserId,
    isSharedWithMe: row.userId !== viewerId,
    ownerLabel: row.userId !== viewerId ? owner?.name || owner?.email || null : null,
  };
}
