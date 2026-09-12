import "server-only";

import { and, eq, inArray, or } from "drizzle-orm";

import * as domain from "@/features/tasks/domain";
import type { TaskSyncStatus } from "@/features/tasks/domain";

import { db } from "@/db/client";
import { tasks, users } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { assertAcceptedConnection } from "@/lib/assert-accepted-connection";

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
 *
 * Compartilhamento (ver `sharedWithUserId` no schema): quem a tarefa foi
 * compartilhada pode ver/editar/concluir, mas só o DONO pode mudar com
 * quem ela está compartilhada ou excluí-la — ver cada método abaixo.
 */
// XP simbólico por só começar uma tarefa — bem menor que o de concluir,
// pra não competir com a recompensa "de verdade" de terminar algo.
const TASK_START_XP = 5;

export class LocalTask
  implements
    domain.CreateTask,
    domain.LoadAllTasks,
    domain.UpdateTask,
    domain.DeleteTask,
    domain.ToggleTaskComplete,
    domain.MarkTaskStarted
{
  async create(params: domain.CreateTask.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    if (params.sharedWithUserId) {
      await assertAcceptedConnection(userId, params.sharedWithUserId);
    }

    await db.insert(tasks).values({
      id,
      userId,
      tag: params.tag,
      title: params.title,
      description: params.description,
      priority: params.priority,
      scheduledAt: params.scheduledAt || null,
      syncEnabled: params.syncEnabled,
      reminderOffsetsMinutes: serializeReminders(params.reminderOffsetsMinutes),
      recurrence: params.recurrence,
      sharedWithUserId: params.sharedWithUserId || null,
    });

    return { id };
  }

  async loadAll(): Promise<domain.LoadAllTasks.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(tasks)
      .where(or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)));

    const ownerIds = [...new Set(rows.filter((row) => row.userId !== userId).map((row) => row.userId))];

    const owners =
      ownerIds.length === 0
        ? []
        : await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ownerIds));

    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

    return rows.map((row) => mapRowToTask(row, userId, ownerById.get(row.userId)));
  }

  async update(params: domain.UpdateTask.Params) {
    const userId = await requireUserId();
    const { id, tag, title, description, priority, scheduledAt, syncEnabled, recurrence } = params;

    const [existing] = await db
      .select({ userId: tasks.userId, sharedWithUserId: tasks.sharedWithUserId })
      .from(tasks)
      .where(and(eq(tasks.id, id), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId))))
      .limit(1);

    if (!existing) {
      throw new Error("Tarefa não encontrada.");
    }

    // Só o dono pode mudar com quem a tarefa está compartilhada — um
    // colaborador editando a tarefa (título, prioridade, etc.) nunca
    // consegue alterar isso de tabela, seu valor de `sharedWithUserId` no
    // formulário é simplesmente ignorado.
    const isOwner = existing.userId === userId;
    let nextSharedWithUserId = existing.sharedWithUserId;

    if (isOwner && params.sharedWithUserId !== existing.sharedWithUserId) {
      if (params.sharedWithUserId) {
        await assertAcceptedConnection(userId, params.sharedWithUserId);
      }
      nextSharedWithUserId = params.sharedWithUserId || null;
    }

    await db
      .update(tasks)
      .set({
        tag,
        title,
        description,
        priority,
        scheduledAt: scheduledAt || null,
        syncEnabled,
        reminderOffsetsMinutes: serializeReminders(params.reminderOffsetsMinutes),
        recurrence,
        sharedWithUserId: nextSharedWithUserId,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId))));
  }

  /** Alterna conclusão — não passa pelo formulário de edição geral (mesmo
   * raciocínio de `updateSyncState` abaixo: estado gerido por uma ação
   * dedicada). Lê o estado atual e inverte, em vez de aceitar um valor
   * explícito do chamador — evita o formulário de edição sobrescrever
   * silenciosamente uma conclusão feita por outra aba/dispositivo. Dono OU
   * colaborador (tarefa compartilhada) podem concluir — é o caso de uso
   * central do compartilhamento (ajudar/lembrar o outro).
   *
   * Tarefa recorrente: ao MARCAR como concluída (nunca ao desmarcar), cria
   * a próxima ocorrência deslocando `scheduledAt` em vez de gerar todas as
   * instâncias futuras de uma vez (ver comentário do schema). A nova
   * ocorrência nasce com `syncEnabled: false` — sincronizá-la com o Google
   * Agenda é uma decisão nova do usuário para aquela ocorrência
   * especificamente, não herdada automaticamente (evita criar uma cadeia
   * de eventos no Google sem confirmação explícita a cada vez). Sem
   * `scheduledAt`, não há o que deslocar, então a recorrência é ignorada
   * silenciosamente (tarefa comum, sem data). A ocorrência seguinte
   * mantém o mesmo `sharedWithUserId` do original.
   */
  async toggleComplete(
    params: domain.ToggleTaskComplete.Params
  ): Promise<domain.ToggleTaskComplete.Result> {
    const userId = await requireUserId();

    const [row] = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, params.id), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)))
      )
      .limit(1);

    if (!row) {
      throw new Error("Tarefa não encontrada.");
    }

    const completed = !row.completed;

    await db
      .update(tasks)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(eq(tasks.id, params.id));

    const nextScheduledAt = completed
      ? domain.computeNextOccurrence(row.scheduledAt, row.recurrence as domain.TaskRecurrence)
      : null;

    if (nextScheduledAt) {
      await db.insert(tasks).values({
        id: crypto.randomUUID(),
        userId: row.userId,
        tag: row.tag,
        title: row.title,
        description: row.description,
        priority: row.priority,
        scheduledAt: nextScheduledAt,
        syncEnabled: false,
        reminderOffsetsMinutes: row.reminderOffsetsMinutes,
        recurrence: row.recurrence,
        sharedWithUserId: row.sharedWithUserId,
      });
    }

    return { completed };
  }

  /** Marca a tarefa como iniciada — dono ou colaborador (mesmo acesso de
   * `toggleComplete`). Idempotente: uma segunda chamada não reconta XP
   * nem sobrescreve o horário do primeiro início. */
  async markStarted(params: domain.MarkTaskStarted.Params): Promise<domain.MarkTaskStarted.Result> {
    const userId = await requireUserId();

    const [row] = await db
      .select({ startedAt: tasks.startedAt })
      .from(tasks)
      .where(
        and(eq(tasks.id, params.id), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)))
      )
      .limit(1);

    if (!row || row.startedAt) {
      return { xpEarned: 0 };
    }

    await db
      .update(tasks)
      .set({ startedAt: new Date() })
      .where(eq(tasks.id, params.id));

    return { xpEarned: TASK_START_XP };
  }

  /** Só o DONO pode excluir — compartilhamento dá acesso de ajudar, nunca
   * de apagar o que é do outro. */
  async delete(params: domain.DeleteTask.Params) {
    const userId = await requireUserId();

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));
  }

  /** Lê uma tarefa específica do usuário logado — usado pela orquestração
   * de sincronização, que precisa saber o `googleEventId` atual antes de
   * decidir se cria, atualiza ou desfaz o vínculo com o Google. Sempre só
   * do dono: sincronização com o Google é uma decisão de quem é dono da
   * tarefa, não de quem colabora nela. */
  async getById(id: string): Promise<domain.ITask | null> {
    const userId = await requireUserId();

    const [row] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    return row ? mapRowToTask(row, userId) : null;
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

function mapRowToTask(
  row: typeof tasks.$inferSelect,
  viewerId: string,
  owner?: { name: string | null; email: string | null }
): domain.ITask {
  return {
    id: row.id,
    userId: row.userId,
    tag: row.tag,
    title: row.title,
    description: row.description,
    priority: row.priority as domain.TaskPriority,
    completed: row.completed,
    completedAt: row.completedAt,
    startedAt: row.startedAt,
    scheduledAt: row.scheduledAt ?? undefined,
    syncEnabled: row.syncEnabled,
    syncStatus: row.syncStatus as TaskSyncStatus,
    syncError: row.syncError,
    googleEventId: row.googleEventId,
    googleEventUpdatedAt: row.googleEventUpdatedAt,
    reminderOffsetsMinutes: deserializeReminders(row.reminderOffsetsMinutes),
    recurrence: row.recurrence as domain.TaskRecurrence,
    sharedWithUserId: row.sharedWithUserId,
    isSharedWithMe: row.userId !== viewerId,
    ownerLabel: row.userId !== viewerId ? owner?.name || owner?.email || null : null,
  };
}

/** `reminder_offsets_minutes` é guardado como texto (JSON de uma lista de
 * números pequena) — ver comentário no schema. Qualquer valor inesperado
 * (coluna corrompida manualmente, por exemplo) vira "sem lembrete" em vez
 * de derrubar a leitura da tarefa. */
function deserializeReminders(value: string | null): number[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "number") : null;
  } catch {
    return null;
  }
}

function serializeReminders(offsets: number[] | null | undefined): string | null {
  if (!offsets || offsets.length === 0) return null;
  return JSON.stringify(offsets);
}
