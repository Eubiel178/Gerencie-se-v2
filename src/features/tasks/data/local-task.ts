import "server-only";

import { and, eq } from "drizzle-orm";

import * as domain from "@/features/tasks/domain";
import type { TaskSyncStatus } from "@/features/tasks/domain";

import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

export type UpdateTaskSyncStateParams = {
  id: string;
  googleEventId: string | null;
  syncStatus: TaskSyncStatus;
  syncError?: string | null;
  googleEventUpdatedAt?: Date | null;
};

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de Task.
 *
 * Substitui a antiga `RemoteTask` (Axios + json-server). Só pode ser usada
 * no servidor — depende do driver `postgres`, que não roda no browser. Por
 * isso ela é consumida exclusivamente pelas Server Actions em
 * `src/features/tasks/actions.ts` e pelo Server Component `Home`, nunca
 * diretamente por um Client Component.
 */
export class LocalTask
  implements
    domain.CreateTask,
    domain.LoadAllTasks,
    domain.UpdateTask,
    domain.DeleteTask
{
  async create(params: domain.CreateTask.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(tasks).values({
      id,
      userId,
      tag: params.tag,
      title: params.title,
      description: params.description,
      scheduledAt: params.scheduledAt || null,
      syncEnabled: params.syncEnabled,
    });

    return { id };
  }

  async loadAll(): Promise<domain.LoadAllTasks.Model> {
    const userId = await requireUserId();

    const rows = await db.select().from(tasks).where(eq(tasks.userId, userId));

    return rows.map(mapRowToTask);
  }

  async update(params: domain.UpdateTask.Params) {
    const userId = await requireUserId();
    const { id, tag, title, description, scheduledAt, syncEnabled } = params;

    await db
      .update(tasks)
      .set({
        tag,
        title,
        description,
        scheduledAt: scheduledAt || null,
        syncEnabled,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  async delete(params: domain.DeleteTask.Params) {
    const userId = await requireUserId();

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));
  }

  /** Lê uma tarefa específica do usuário logado — usado pela orquestração
   * de sincronização, que precisa saber o `googleEventId` atual antes de
   * decidir se cria, atualiza ou desfaz o vínculo com o Google. */
  async getById(id: string): Promise<domain.ITask | null> {
    const userId = await requireUserId();

    const [row] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    return row ? mapRowToTask(row) : null;
  }

  /**
   * Atualiza só o estado de sincronização com o Google Agenda (nunca os
   * dados de conteúdo da tarefa). Usado exclusivamente pela orquestração em
   * `src/features/tasks/actions.ts` e pelo motor de polling — nunca
   * chamado a partir de um formulário do usuário, por isso não faz parte
   * do contrato público `UpdateTask`.
   */
  async updateSyncState(params: UpdateTaskSyncStateParams) {
    const userId = await requireUserId();

    await db
      .update(tasks)
      .set({
        googleEventId: params.googleEventId,
        syncStatus: params.syncStatus,
        syncError: params.syncError ?? null,
        googleEventUpdatedAt: params.googleEventUpdatedAt ?? null,
      })
      .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));
  }

  /** Desfaz o vínculo desta tarefa com o Google — usado quando o evento
   * correspondente foi excluído no lado do Google (detectado pelo
   * polling). A tarefa em si NUNCA é apagada por causa disso; só deixa de
   * estar marcada para sincronizar. */
  async unlinkFromGoogle(id: string): Promise<void> {
    const userId = await requireUserId();

    await db
      .update(tasks)
      .set({
        googleEventId: null,
        syncEnabled: false,
        syncStatus: "NONE",
        syncError: null,
        googleEventUpdatedAt: null,
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  /** Sobrescreve o conteúdo de uma tarefa a partir de uma mudança feita no
   * lado do Google (polling Google→App) — não passa pelas mesmas
   * validações de formulário porque a origem do dado é o próprio Google,
   * não um usuário digitando no app. */
  async applyGoogleUpdate(params: {
    id: string;
    title: string;
    description: string;
    scheduledAt: string | null;
    googleEventUpdatedAt: Date;
  }) {
    const userId = await requireUserId();

    await db
      .update(tasks)
      .set({
        title: params.title,
        description: params.description,
        scheduledAt: params.scheduledAt,
        googleEventUpdatedAt: params.googleEventUpdatedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));
  }
}

function mapRowToTask(row: typeof tasks.$inferSelect): domain.ITask {
  return {
    id: row.id,
    userId: row.userId,
    tag: row.tag,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduledAt ?? undefined,
    syncEnabled: row.syncEnabled,
    syncStatus: row.syncStatus as TaskSyncStatus,
    syncError: row.syncError,
    googleEventId: row.googleEventId,
    googleEventUpdatedAt: row.googleEventUpdatedAt,
  };
}
