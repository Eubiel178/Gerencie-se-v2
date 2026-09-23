import "server-only";

import dayjs from "dayjs";
import { and, asc, eq, gte, inArray, or } from "drizzle-orm";


import { db } from "@/db/client";
import { routineItemLogs, routineItems, users } from "@/db/schema";
import * as domain from "@/features/routine/domain";
import { requireUserId } from "@/lib/auth";
import { assertAcceptedConnection, resolveSharedWithUserIdOnUpdate } from "@/lib/auth/assert-accepted-connection";

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
    domain.DeleteRoutineItem,
    domain.ToggleRoutineItemLog,
    domain.LoadRoutineItemLogsInRange
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

    const itemIds = rows.map((row) => row.id);
    const today = dayjs().format("YYYY-MM-DD");

    // Não filtra por `userId`: um item compartilhado tem UM registro de
    // "feito hoje" só, igual `habit_log` — ver comentário da classe.
    const todaysLogRows =
      itemIds.length === 0
        ? []
        : await db
            .select({ routineItemId: routineItemLogs.routineItemId })
            .from(routineItemLogs)
            .where(and(inArray(routineItemLogs.routineItemId, itemIds), eq(routineItemLogs.date, today)));

    const completedTodayIds = new Set(todaysLogRows.map((log) => log.routineItemId));

    return rows.map((row) =>
      mapRowToRoutineItem(row, userId, completedTodayIds.has(row.id), ownerById.get(row.userId))
    );
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
    const nextSharedWithUserId = await resolveSharedWithUserIdOnUpdate({
      userId,
      isOwner: existing.userId === userId,
      currentSharedWithUserId: existing.sharedWithUserId,
      requestedSharedWithUserId: params.sharedWithUserId,
    });

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

  async toggleLog(params: domain.ToggleRoutineItemLog.Params): Promise<domain.ToggleRoutineItemLog.Result> {
    const userId = await requireUserId();

    const [item] = await db
      .select({ id: routineItems.id })
      .from(routineItems)
      .where(
        and(
          eq(routineItems.id, params.routineItemId),
          or(eq(routineItems.userId, userId), eq(routineItems.sharedWithUserId, userId))
        )
      )
      .limit(1);

    if (!item) {
      throw new Error("Item de rotina não encontrado.");
    }

    // Não filtra por `userId`: a chave primária de `routine_item_log` é
    // (routineItemId, date), então só existe UM registro por dia — de
    // quem quer que tenha marcado primeiro. Ver comentário da classe.
    const [existing] = await db
      .select({ id: routineItemLogs.id })
      .from(routineItemLogs)
      .where(
        and(eq(routineItemLogs.routineItemId, params.routineItemId), eq(routineItemLogs.date, params.date))
      )
      .limit(1);

    if (existing) {
      await db.delete(routineItemLogs).where(eq(routineItemLogs.id, existing.id));
      return { completed: false };
    }

    try {
      await db.insert(routineItemLogs).values({
        id: crypto.randomUUID(),
        routineItemId: params.routineItemId,
        userId,
        date: params.date,
      });

      return { completed: true };
    } catch (error) {
      // Corrida rara (dois cliques quase simultâneos, inclusive entre
      // dono e colaborador): outra requisição já inseriu o mesmo
      // (routineItemId, date) entre o SELECT acima e este INSERT — a
      // chave primária composta rejeita a duplicata. O item já está
      // marcado, então tratamos como sucesso em vez de propagar um erro
      // confuso.
      const isUniqueViolation =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505";

      if (isUniqueViolation) {
        return { completed: true };
      }

      throw error;
    }
  }

  /** Ocorrências concluídas de rotina com identidade (título) — usado
   * pelo Histórico, onde cada dia é uma entrada independente e o nome do
   * item de rotina é parte do que o usuário precisa ver. O mesmo item
   * pode aparecer em vários dias, e cada dia é uma entrada independente.
   * Não é limitado ao dia atual — cobre todo o período solicitado. */
  async loadRoutineItemLogsInRange(since: Date): Promise<domain.RoutineLogEntry[]> {
    const userId = await requireUserId();

    const itemRows = await db
      .select({ id: routineItems.id, title: routineItems.title })
      .from(routineItems)
      .where(or(eq(routineItems.userId, userId), eq(routineItems.sharedWithUserId, userId)));

    if (itemRows.length === 0) return [];

    const itemIds = itemRows.map((row) => row.id);
    const titleById = new Map(itemRows.map((row) => [row.id, row.title]));
    const sinceDate = dayjs(since).format("YYYY-MM-DD");

    const logRows = await db
      .select({
        routineItemId: routineItemLogs.routineItemId,
        date: routineItemLogs.date,
        completedAt: routineItemLogs.completedAt,
      })
      .from(routineItemLogs)
      .where(and(inArray(routineItemLogs.routineItemId, itemIds), gte(routineItemLogs.date, sinceDate)));

    return logRows.map((row) => ({
      routineItemId: row.routineItemId,
      routineItemTitle: titleById.get(row.routineItemId) ?? "",
      date: row.date,
      completedAt: row.completedAt,
    }));
  }
}

function mapRowToRoutineItem(
  row: typeof routineItems.$inferSelect,
  viewerId: string,
  completedToday: boolean,
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
    completedToday,
  };
}
