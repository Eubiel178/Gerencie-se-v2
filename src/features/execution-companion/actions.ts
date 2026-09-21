"use server";

import { revalidatePath } from "next/cache";

import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import type { ActionResult } from "@/types/action-result";
import {
  startExecutionSessionSchema,
  executionActionSchema,
} from "@/validation/execution-session-schema";

import { getExecutionSessionFetcher } from "./data/local-execution-session";
import type { IExecutionSession } from "./domain/types";


export async function startExecutionSessionAction(
  data: { taskId: string }
): Promise<ActionResult & { session?: IExecutionSession; switched?: boolean; previousTaskId?: string }> {
  const parsed = startExecutionSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const repo = getExecutionSessionFetcher();
    const taskFetcher = getTaskFetcher();
    const task = await taskFetcher.getById(data.taskId);

    if (!task) {
      return { error: "Tarefa não encontrada." };
    }

    const existing = await repo.getActive();

    let session: IExecutionSession;
    let switched = false;
    let previousTaskId: string | undefined;

    if (existing) {
      if (existing.taskId === data.taskId) {
        return { error: "Essa tarefa já está em andamento." };
      }
      previousTaskId = existing.taskId;
      // Switch atômico: pausa sessão A, cria sessão B
      session = await repo.switchToTask(data.taskId);
      // Atualiza workStatus da task antiga para paused
      await taskFetcher.setWorkStatus({ id: existing.taskId, workStatus: "paused" });
      switched = true;
    } else {
      session = await repo.create({ taskId: data.taskId });
    }

    await getMascotFetcher().addXp(5);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return {
      error: null,
      session,
      switched,
      previousTaskId,
    };
  } catch {
    return { error: "Não foi possível criar a sessão de execução. Tente novamente." };
  }
}

export async function pauseExecutionSessionAction(
  data: { sessionId: string }
): Promise<ActionResult> {
  const parsed = executionActionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const repo = getExecutionSessionFetcher();
    await repo.pause(data.sessionId);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível pausar a sessão. Tente novamente." };
  }
}

export async function resumeExecutionSessionAction(
  data: { sessionId: string }
): Promise<ActionResult> {
  const parsed = executionActionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const repo = getExecutionSessionFetcher();
    await repo.resume(data.sessionId);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível retomar a sessão. Tente novamente." };
  }
}

export async function completeExecutionSessionAction(
  data: { sessionId: string }
): Promise<ActionResult> {
  const parsed = executionActionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const repo = getExecutionSessionFetcher();
    await repo.complete(data.sessionId);

    await getMascotFetcher().addXp(15);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível finalizar a sessão. Tente novamente." };
  }
}

export async function abandonExecutionSessionAction(
  data: { sessionId: string }
): Promise<ActionResult> {
  const parsed = executionActionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const repo = getExecutionSessionFetcher();
    await repo.abandon(data.sessionId);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível abandonar a sessão. Tente novamente." };
  }
}
