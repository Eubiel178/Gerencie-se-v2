"use server";

import { revalidatePath } from "next/cache";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";

import { getExecutionSessionFetcher } from "./data/local-execution-session";
import {
  startExecutionSessionSchema,
  executionActionSchema,
} from "@/validation/execution-session-schema";
import type { ActionResult } from "@/types/action-result";

import type { IExecutionSession } from "./domain/types";
import { emitMascotEvent } from "@/features/mascot-pet";

export async function startExecutionSessionAction(
  data: { taskId: string }
): Promise<ActionResult & { session?: IExecutionSession }> {
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
    if (existing) {
      return { error: "Você já tem uma sessão de execução ativa. Termine ou pause ela primeiro." };
    }

    const session = await repo.create({
      taskId: data.taskId,
    });

    await getMascotFetcher().addXp(5);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return {
      error: null,
      session,
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
    emitMascotEvent("task-completed");

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
