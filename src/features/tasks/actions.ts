"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/tasks/domain";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { createTaskSchema, updateTaskSchema } from "@/validation/task-schema";

import { requireUserId } from "@/lib/auth";
import { deleteCalendarEventForTask } from "@/lib/integrations/google-calendar";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";

import { syncTaskToGoogle } from "./sync";

/**
 * Server Actions de Task.
 *
 * `LocalTask` (via `getTaskFetcher`) usa Drizzle + o driver `postgres`, que
 * só existem no servidor — por isso os Client Components (AddTask, EditTask,
 * o Card com o botão de excluir) não chamam mais o repositório diretamente
 * e passam a chamar estas actions, que rodam sempre no servidor e resolvem
 * o usuário dono dos dados a partir da sessão (nunca de um valor vindo do
 * formulário).
 *
 * A sincronização com o Google Agenda (ver `./sync.ts`) acontece DEPOIS da
 * tarefa já estar salva localmente — uma falha ali nunca desfaz nem
 * impede a operação local, só fica registrada em `syncStatus`/`syncError`.
 */
import type { ActionResult } from "@/types/action-result";

export async function createTaskAction(
  data: domain.CreateTask.Params
): Promise<ActionResult & { task?: domain.ITask }> {
  const parsed = createTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const repo = getTaskFetcher();
    const userId = await requireUserId();
    const { id } = await repo.create(data);

    await syncTaskToGoogle(
      {
        id,
        userId,
        tag: data.tag,
        title: data.title,
        description: data.description,
        priority: data.priority,
        completed: false,
        completedAt: null,
        startedAt: null,
        steps: [],
        scheduledAt: data.scheduledAt,
        syncEnabled: data.syncEnabled,
        recurrence: data.recurrence,
        syncStatus: "NONE",
        syncError: null,
        googleEventId: null,
        isSharedWithMe: false,
      },
      repo
    );
    const task = await repo.getById(id);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null, task: task ?? undefined };
  } catch {
    return { error: "Não foi possível salvar a tarefa. Tente novamente." };
  }
}

/**
 * "Despejo mental": captura rápida sem nenhuma decisão prévia (tag,
 * prioridade, data) — só o texto. Nasce como uma tarefa comum com
 * valores padrão neutros; refinar (categorizar, agendar, etc.) é uma
 * ação separada e opcional depois, editando normalmente. A ideia é
 * nunca deixar a fricção de "preencher o formulário inteiro" competir
 * com o impulso de anotar algo antes que se perca.
 */
export async function quickCaptureTaskAction(
  rawTitle: string
): Promise<ActionResult & { task?: domain.ITask }> {
  const title = rawTitle.trim();

  if (!title) {
    return { error: "Digite alguma coisa antes de capturar." };
  }

  return createTaskAction({
    tag: "other",
    title,
    description: "",
    priority: "media",
    recurrence: "none",
    syncEnabled: false,
  });
}

export async function updateTaskAction(
  data: domain.UpdateTask.Params
): Promise<ActionResult> {
  const parsed = updateTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const repo = getTaskFetcher();
    const userId = await requireUserId();
    const previousTask = await repo.getById(data.id);

    await repo.update(data);

    await syncTaskToGoogle(
      {
        id: data.id,
        userId,
        tag: data.tag,
        title: data.title,
        description: data.description,
        priority: data.priority,
        completed: previousTask?.completed ?? false,
        completedAt: previousTask?.completedAt ?? null,
        startedAt: previousTask?.startedAt ?? null,
        steps: previousTask?.steps ?? [],
        scheduledAt: data.scheduledAt,
        syncEnabled: data.syncEnabled,
        recurrence: data.recurrence,
        syncStatus: previousTask?.syncStatus ?? "NONE",
        syncError: previousTask?.syncError ?? null,
        googleEventId: previousTask?.googleEventId ?? null,
        isSharedWithMe: false,
      },
      repo
    );

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return {
      error: "Não foi possível salvar as alterações. Tente novamente.",
    };
  }
}

export async function deleteTaskAction(
  params: domain.DeleteTask.Params
): Promise<ActionResult> {
  try {
    const repo = getTaskFetcher();
    const userId = await requireUserId();
    const existingTask = await repo.getById(params.id);

    await repo.delete(params);

    // Exclusão da tarefa nunca depende do Google: o evento correspondente
    // é removido em melhor esforço depois que a tarefa já sumiu do app.
    if (existingTask?.googleEventId) {
      try {
        await deleteCalendarEventForTask(userId, existingTask.googleEventId);
      } catch {
        // Ignorado de propósito — a tarefa já foi excluída localmente, que
        // é o que o usuário pediu.
      }
    }

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir a tarefa. Tente novamente." };
  }
}

export async function toggleTaskCompleteAction(
  params: domain.ToggleTaskComplete.Params
): Promise<ActionResult & { completed?: boolean }> {
  try {
    const repo = getTaskFetcher();
    const result = await repo.toggleComplete(params);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null, completed: result.completed };
  } catch {
    return { error: "Não foi possível atualizar a tarefa. Tente novamente." };
  }
}

/**
 * "Começar também conta": marca a tarefa como iniciada e, se essa foi a
 * primeira vez (`xpEarned > 0`), soma o XP ao mascote — mesma
 * orquestração de `completeFocusSessionAction` em `features/focus`
 * (repositório só mexe na própria entidade, a soma de XP acontece aqui).
 */
export async function markTaskStartedAction(
  params: domain.MarkTaskStarted.Params
): Promise<ActionResult> {
  try {
    const repo = getTaskFetcher();
    const result = await repo.markStarted(params);

    if (result.xpEarned > 0) {
      await getMascotFetcher().addXp(result.xpEarned);
    }

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível marcar a tarefa como iniciada. Tente novamente." };
  }
}

export async function setTaskWorkStatusAction(
  params: domain.SetTaskWorkStatus.Params
): Promise<ActionResult> {
  try {
    await getTaskFetcher().setWorkStatus(params);
    revalidatePath("/home");
    revalidatePath("/home/tasks");
    return { error: null };
  } catch {
    return { error: "Não foi possível atualizar o status da tarefa. Tente novamente." };
  }
}

/** "Quebrar tarefa em passos menores" (Modo Assistido) — mesma
 * orquestração simples usada em Goals: repositório cuida só da entidade,
 * a action só chama e revalida. */
export async function createTaskStepAction(
  params: domain.CreateTaskStep.Params
): Promise<ActionResult & { id?: string }> {
  try {
    const { id } = await getTaskFetcher().createStep(params);
    revalidatePath("/home/tasks");
    revalidatePath("/home");

    return { error: null, id };
  } catch {
    return { error: "Não foi possível adicionar o passo. Tente novamente." };
  }
}

export async function createTaskStepsAction(
  params: domain.CreateTaskSteps.Params
): Promise<ActionResult & { ids?: string[] }> {
  if (params.titles.some((title) => !title.trim())) {
    return { error: "Cada passo precisa ter um título." };
  }

  try {
    const { ids } = await getTaskFetcher().createSteps(params);
    revalidatePath("/home/tasks");
    revalidatePath("/home");
    return { error: null, ids };
  } catch {
    return { error: "Não foi possível adicionar os passos. Tente novamente." };
  }
}

export async function updateTaskStepAction(
  params: domain.UpdateTaskStep.Params
): Promise<ActionResult> {
  if (params.title !== undefined && !params.title.trim()) {
    return { error: "O passo precisa ter um título." };
  }

  if (params.completed === undefined && params.title === undefined) {
    return { error: "Nenhuma alteração foi informada para o passo." };
  }

  try {
    await getTaskFetcher().updateStep(params);
    revalidatePath("/home/tasks");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível atualizar o passo. Tente novamente." };
  }
}

export async function deleteTaskStepAction(
  params: domain.DeleteTaskStep.Params
): Promise<ActionResult> {
  try {
    await getTaskFetcher().deleteStep(params);
    revalidatePath("/home/tasks");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível remover o passo. Tente novamente." };
  }
}

export async function reorderTaskStepsAction(
  params: domain.ReorderTaskSteps.Params
): Promise<ActionResult> {
  try {
    await getTaskFetcher().reorderSteps(params);
    revalidatePath("/home/tasks");
    revalidatePath("/home");
    return { error: null };
  } catch {
    return { error: "Não foi possível reordenar os passos. Tente novamente." };
  }
}

/** Permite tentar de novo uma sincronização que ficou com `syncStatus:
 * "ERROR"` (Google indisponível, token expirado sem conseguir renovar,
 * etc.) sem precisar reabrir e resalvar o formulário de edição. */
export async function retryTaskSyncAction(
  params: domain.DeleteTask.Params
): Promise<ActionResult & { task?: domain.ITask }> {
  try {
    const repo = getTaskFetcher();
    const task = await repo.getById(params.id);

    if (!task) {
      return { error: "Tarefa não encontrada." };
    }

      await syncTaskToGoogle(task, repo);
      const refreshedTask = await repo.getById(params.id);
      revalidatePath("/home");
      revalidatePath("/home/tasks");

      return { error: null, task: refreshedTask ?? undefined };
  } catch {
    return { error: "Não foi possível sincronizar agora. Tente novamente." };
  }
}

/** Liga/desliga o 2º canal (e-mail) de lembrete de tarefa — mesmo padrão
 * de `updateWeeklySummaryPreferenceAction` (upsert numa única coluna
 * boolean em `user_preference`, desligado por padrão). */
export async function updateEmailTaskRemindersPreferenceAction(enabled: boolean): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, emailTaskReminders: enabled })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { emailTaskReminders: enabled },
      });

    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar a preferência. Tente novamente." };
  }
}
