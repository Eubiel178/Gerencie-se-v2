"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/tasks/domain";
import { LocalTask } from "@/features/tasks/data";

import { requireUserId } from "@/lib/require-user-id";
import { deleteCalendarEventForTask } from "@/lib/google-calendar";

import { syncTaskToGoogle } from "./sync";

/**
 * Server Actions de Task.
 *
 * `LocalTask` usa Drizzle + @libsql/client, que só existem no servidor — por
 * isso os Client Components (AddTask, EditTask, o Card com o botão de
 * excluir) não chamam mais o repositório diretamente e passam a chamar
 * estas actions, que rodam sempre no servidor e resolvem o usuário dono dos
 * dados a partir da sessão (nunca de um valor vindo do formulário).
 *
 * A sincronização com o Google Agenda (ver `./sync.ts`) acontece DEPOIS da
 * tarefa já estar salva localmente — uma falha ali nunca desfaz nem
 * impede a operação local, só fica registrada em `syncStatus`/`syncError`.
 */
function getTaskRepository() {
  return new LocalTask();
}

type ActionResult = { error: string | null };

export async function createTaskAction(
  data: domain.CreateTask.Params
): Promise<ActionResult> {
  try {
    const repo = getTaskRepository();
    const userId = await requireUserId();
    const { id } = await repo.create(data);

    await syncTaskToGoogle(
      {
        id,
        userId,
        tag: data.tag,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt,
        syncEnabled: data.syncEnabled,
        syncStatus: "NONE",
        syncError: null,
        googleEventId: null,
      },
      repo
    );

    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar a tarefa. Tente novamente." };
  }
}

export async function updateTaskAction(
  data: domain.UpdateTask.Params
): Promise<ActionResult> {
  try {
    const repo = getTaskRepository();
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
        scheduledAt: data.scheduledAt,
        syncEnabled: data.syncEnabled,
        syncStatus: previousTask?.syncStatus ?? "NONE",
        syncError: previousTask?.syncError ?? null,
        googleEventId: previousTask?.googleEventId ?? null,
      },
      repo
    );

    revalidatePath("/home");

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
    const repo = getTaskRepository();
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

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir a tarefa. Tente novamente." };
  }
}

/** Permite tentar de novo uma sincronização que ficou com `syncStatus:
 * "ERROR"` (Google indisponível, token expirado sem conseguir renovar,
 * etc.) sem precisar reabrir e resalvar o formulário de edição. */
export async function retryTaskSyncAction(
  params: domain.DeleteTask.Params
): Promise<ActionResult> {
  try {
    const repo = getTaskRepository();
    const task = await repo.getById(params.id);

    if (!task) {
      return { error: "Tarefa não encontrada." };
    }

    await syncTaskToGoogle(task, repo);
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível sincronizar agora. Tente novamente." };
  }
}
