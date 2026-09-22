import "server-only";

import { and, count, eq, inArray, max, or } from "drizzle-orm";

import { db } from "@/db/client";
import { taskAttachments, taskSteps, tasks, users } from "@/db/schema";
import * as domain from "@/features/tasks/domain";
import type { TaskSyncStatus } from "@/features/tasks/domain";
import { requireUserId } from "@/lib/auth";
import { assertAcceptedConnection, resolveSharedWithUserIdOnUpdate } from "@/lib/auth/assert-accepted-connection";

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
    domain.MarkTaskStarted,
    domain.SetTaskWorkStatus,
    domain.CreateTaskStep,
    domain.CreateTaskSteps,
    domain.UpdateTaskStep,
    domain.DeleteTaskStep,
    domain.ReorderTaskSteps
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

    // `.orderBy` explícito é OBRIGATÓRIO aqui - sem isso, o Postgres não
    // garante a MESMA ordem entre duas leituras da mesma tabela, e um
    // simples UPDATE (ex.: pausar/retomar, que só muda `work_status`) pode
    // mudar a posição física da linha o suficiente pra alterar a ordem
    // devolvida na PRÓXIMA leitura. Como a lista é revalidada a cada ação
    // (pausar/retomar/concluir), isso aparecia como "a lista se reorganiza
    // sozinha" (achado relatado) mesmo a ordenação por prioridade em
    // `sortTasksByPriority` sendo estável - ela só preserva a ordem de
    // ENTRADA entre itens empatados, e a ordem de entrada em si já vinha
    // instável. `createdAt` (nunca muda depois de criada a tarefa) é a
    // única coluna que garante posição estável entre leituras.
    const rows = await db
      .select()
      .from(tasks)
      .where(or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)))
      .orderBy(tasks.createdAt);

    const ownerIds = [...new Set(rows.filter((row) => row.userId !== userId).map((row) => row.userId))];

    const owners =
      ownerIds.length === 0
        ? []
        : await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ownerIds));

    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

    const taskIds = rows.map((row) => row.id);
    const stepRows =
      taskIds.length === 0
        ? []
        : await db
            .select()
            .from(taskSteps)
            .where(inArray(taskSteps.taskId, taskIds))
            .orderBy(taskSteps.order);

    const stepsByTaskId = new Map<string, domain.ITaskStep[]>();
    for (const step of stepRows) {
      const list = stepsByTaskId.get(step.taskId) ?? [];
      list.push(step);
      stepsByTaskId.set(step.taskId, list);
    }

    const attachmentRows =
      taskIds.length === 0
        ? []
        : await db
            .select({
              taskId: taskAttachments.taskId,
              total: count(taskAttachments.id),
            })
            .from(taskAttachments)
            .where(inArray(taskAttachments.taskId, taskIds))
            .groupBy(taskAttachments.taskId);
    const attachmentCountByTaskId = new Map(
      attachmentRows.map((row) => [row.taskId, row.total])
    );

    return rows.map((row) =>
      mapRowToTask(
        row,
        userId,
        ownerById.get(row.userId),
        stepsByTaskId.get(row.id) ?? [],
        attachmentCountByTaskId.get(row.id) ?? 0
      )
    );
  }

  /** Dados mínimos para o agendador global de lembretes. Não usa
   * `loadAll()`: o layout é revalidado com frequência e o agendador não
   * precisa buscar passos, donos nem os demais campos de cada tarefa. */
  async loadReminderTasks() {
    const userId = await requireUserId();

    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        completed: tasks.completed,
        scheduledAt: tasks.scheduledAt,
        reminderOffsetsMinutes: tasks.reminderOffsetsMinutes,
      })
      .from(tasks)
      .where(or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)));

    return rows.map((row) => ({
      ...row,
      reminderOffsetsMinutes: deserializeReminders(row.reminderOffsetsMinutes),
    }));
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
    const nextSharedWithUserId = await resolveSharedWithUserIdOnUpdate({
      userId,
      isOwner: existing.userId === userId,
      currentSharedWithUserId: existing.sharedWithUserId,
      requestedSharedWithUserId: params.sharedWithUserId,
    });

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

    if (!row) {
      return { xpEarned: 0 };
    }

    await db
      .update(tasks)
      .set({ startedAt: row.startedAt ?? new Date(), workStatus: "in_progress", pausedAt: null })
      .where(eq(tasks.id, params.id));

    return { xpEarned: row.startedAt ? 0 : TASK_START_XP };
  }

  async setWorkStatus(params: domain.SetTaskWorkStatus.Params): Promise<void> {
    const userId = await requireUserId();
    await db
      .update(tasks)
      .set({
        workStatus: params.workStatus,
        pausedAt: params.workStatus === "paused" ? new Date() : null,
      })
      .where(
        and(eq(tasks.id, params.id), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)))
      );
  }

  async createStep(params: domain.CreateTaskStep.Params) {
    const { ids } = await this.createSteps({ taskId: params.taskId, titles: [params.title] });
    return { id: ids[0] };
  }

  async createSteps(params: domain.CreateTaskSteps.Params) {
    const userId = await requireUserId();

    const titles = params.titles.map((title) => title.trim()).filter(Boolean);
    if (titles.length === 0) return { ids: [] };

    // `taskId` vem do cliente — sem essa checagem, qualquer usuário
    // autenticado que soubesse/adivinhasse o UUID de uma tarefa alheia
    // conseguiria injetar um passo nela. Dono OU colaborador (tarefa
    // compartilhada) podem adicionar passos — mesmo espírito de ajudar.
    const [accessibleTask] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(eq(tasks.id, params.taskId), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)))
      )
      .limit(1);

    if (!accessibleTask) {
      throw new Error("Tarefa não encontrada.");
    }

    const [{ maxOrder }] = await db
      .select({ maxOrder: max(taskSteps.order) })
      .from(taskSteps)
      .where(eq(taskSteps.taskId, params.taskId));

    const ids = titles.map(() => crypto.randomUUID());
    await db.transaction(async (tx) => {
      await tx.insert(taskSteps).values(
        titles.map((title, index) => ({
          id: ids[index],
          taskId: params.taskId,
          userId,
          title,
          order: (maxOrder ?? -1) + index + 1,
        }))
      );
    });

    return { ids };
  }

  async updateStep(params: domain.UpdateTaskStep.Params) {
    const userId = await requireUserId();

    await this.assertStepAccess(params.id, userId);

    const update: Partial<Pick<typeof taskSteps.$inferInsert, "completed" | "title">> = {};

    if (typeof params.completed === "boolean") update.completed = params.completed;
    if (params.title !== undefined) update.title = params.title.trim();

    if (Object.keys(update).length === 0) return;

    await db.update(taskSteps).set(update).where(eq(taskSteps.id, params.id));
  }

  async deleteStep(params: domain.DeleteTaskStep.Params) {
    const userId = await requireUserId();

    await this.assertStepAccess(params.id, userId);

    await db.delete(taskSteps).where(eq(taskSteps.id, params.id));
  }

  async reorderSteps(params: domain.ReorderTaskSteps.Params) {
    const userId = await requireUserId();

    const accessible = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(eq(tasks.id, params.taskId), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId)))
      )
      .limit(1);

    if (!accessible[0]) throw new Error("Tarefa não encontrada.");

    const rows = await db
      .select({ id: taskSteps.id })
      .from(taskSteps)
      .where(eq(taskSteps.taskId, params.taskId));
    const existingIds = new Set(rows.map((row) => row.id));

    if (
      params.orderedStepIds.length !== rows.length ||
      new Set(params.orderedStepIds).size !== rows.length ||
      params.orderedStepIds.some((id) => !existingIds.has(id))
    ) {
      throw new Error("A ordem dos passos é inválida.");
    }

    await db.transaction(async (tx) => {
      await Promise.all(
        params.orderedStepIds.map((id, order) =>
          tx.update(taskSteps).set({ order }).where(eq(taskSteps.id, id))
        )
      );
    });
  }

  /** Passo não tem dono próprio — o acesso é sempre decidido pela tarefa
   * (dono OU colaborador), nunca por `task_step.userId` (que só registra
   * quem criou o passo). */
  private async assertStepAccess(stepId: string, userId: string): Promise<void> {
    const [row] = await db
      .select({ taskUserId: tasks.userId, taskSharedWithUserId: tasks.sharedWithUserId })
      .from(taskSteps)
      .innerJoin(tasks, eq(taskSteps.taskId, tasks.id))
      .where(eq(taskSteps.id, stepId))
      .limit(1);

    if (!row || (row.taskUserId !== userId && row.taskSharedWithUserId !== userId)) {
      throw new Error("Passo não encontrado.");
    }
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

    if (!row) return null;

    const stepRows = await db
      .select()
      .from(taskSteps)
      .where(eq(taskSteps.taskId, row.id))
      .orderBy(taskSteps.order);

    const steps: domain.ITaskStep[] = stepRows.map((s) => ({
      id: s.id,
      taskId: s.taskId,
      title: s.title,
      completed: s.completed,
      order: s.order,
    }));

    return mapRowToTask(row, userId, undefined, steps);
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
  owner?: { name: string | null; email: string | null },
  steps: domain.ITaskStep[] = [],
  attachmentCount = 0
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
    workStatus: row.workStatus as domain.TaskWorkStatus,
    pausedAt: row.pausedAt,
    steps,
    attachmentCount,
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
export function deserializeReminders(value: string | null): number[] | null {
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
