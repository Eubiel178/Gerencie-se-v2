import "server-only";

import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";

import { getCompanionAction, type CompanionAction } from "../domain/actions";

function auditLog(params: {
  userId: string;
  action: string;
  params: Record<string, unknown>;
  success: boolean;
  error?: string;
}) {
  console.log(
    `[Audit] ${params.userId} | ${params.action} | ${params.success ? "OK" : "FAIL"}${params.error ? ` | ${params.error}` : ""}`,
  );
}

export interface ActionProposal {
  action: string;
  params: Record<string, unknown>;
  confidence: number;
  risk: string;
  requiresConfirmation: boolean;
}

export interface ValidatedProposal extends ActionProposal {
  valid: true;
  validatedParams: Record<string, unknown>;
}

export interface InvalidProposal {
  valid: false;
  error: string;
}

export async function validateActionProposal(
  proposal: ActionProposal,
): Promise<ValidatedProposal | InvalidProposal> {
  const actionDef = getCompanionAction(proposal.action);
  if (!actionDef) {
    return { valid: false, error: `Ação "${proposal.action}" não permitida.` };
  }

  const parsed = actionDef.paramsSchema.safeParse(proposal.params);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Parâmetros inválidos.";
    return { valid: false, error: msg };
  }

  // Se precisa de taskId, verificar que existe e pertence ao usuário
  const params = parsed.data as Record<string, unknown>;
  if ("taskId" in params && typeof params.taskId === "string") {
    const repo = getTaskFetcher();
    const task = await repo.getById(params.taskId);
    if (!task) {
      return { valid: false, error: "Tarefa não encontrada." };
    }
  }

  return {
    ...proposal,
    valid: true,
    validatedParams: parsed.data as Record<string, unknown>,
  };
}

export async function executeAction(
  actionName: string,
  params: Record<string, unknown>,
): Promise<ActionResult & { result?: unknown }> {
  const actionDef = getCompanionAction(actionName);
  if (!actionDef) {
    return { error: `Ação "${actionName}" não é permitida.` };
  }

  // Auth — userId determinado server-side
  const userId = await requireUserId().catch(() => {
    throw new Error("UNAUTHORIZED");
  });

  try {
    let result: ActionResult & { result?: unknown };

    switch (actionName) {
      case "task.create":
        result = await executeCreateTask(params);
        break;
      case "task.complete":
        result = await executeCompleteTask(params);
        break;
      case "task.updateDueDate":
        result = await executeUpdateTaskDueDate(params);
        break;
      case "task.update":
        result = await executeUpdateTask(params);
        break;
      case "task.addStep":
        result = await executeAddTaskStep(params);
        break;
      case "task.startExecution":
        result = await executeStartExecution(params);
        break;
      default:
        result = { error: `Ação "${actionName}" não implementada.` };
    }

    auditLog({ userId, action: actionName, params, success: !result.error, error: result.error ?? undefined });
    return result;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    if (msg === "UNAUTHORIZED") {
      return { error: "Não autorizado." };
    }
    auditLog({ userId, action: actionName, params, success: false, error: msg });
    console.error(`[ActionExecutor] ${actionName} falhou:`, e);
    return { error: "Não foi possível executar a ação. Tente novamente." };
  }
}

async function executeCreateTask(
  params: Record<string, unknown>,
): Promise<ActionResult & { result?: unknown }> {
  const { createTaskAction } = await import("@/features/tasks/actions");
  const result = await createTaskAction({
    tag: (params.tag as string) ?? "other",
    title: params.title as string,
    description: (params.description as string) ?? "",
    priority: (params.priority as "baixa" | "media" | "alta" | "critica") ?? "media",
    scheduledAt: params.scheduledAt as string | undefined,
    recurrence: "none",
    syncEnabled: false,
  });

  if (result.error) return { error: result.error };
  return { error: null, result: result.task };
}

async function executeCompleteTask(
  params: Record<string, unknown>,
): Promise<ActionResult & { result?: unknown }> {
  const { toggleTaskCompleteAction } = await import("@/features/tasks/actions");
  const result = await toggleTaskCompleteAction({ id: params.taskId as string });

  if (result.error) return { error: result.error };
  return { error: null, result: { completed: result.completed } };
}

async function executeUpdateTaskDueDate(
  params: Record<string, unknown>,
): Promise<ActionResult & { result?: unknown }> {
  const repo = getTaskFetcher();
  const task = await repo.getById(params.taskId as string);
  if (!task) return { error: "Tarefa não encontrada." };

  const { updateTaskAction } = await import("@/features/tasks/actions");
  const result = await updateTaskAction({
    id: task.id,
    tag: task.tag,
    title: task.title,
    description: task.description,
    priority: task.priority,
    scheduledAt: params.scheduledAt as string,
    recurrence: task.recurrence,
    syncEnabled: task.syncEnabled,
    reminderOffsetsMinutes: task.reminderOffsetsMinutes ?? undefined,
    sharedWithUserId: task.sharedWithUserId ?? undefined,
  });

  if (result.error) return { error: result.error };
  return { error: null };
}

async function executeUpdateTask(
  params: Record<string, unknown>,
): Promise<ActionResult & { result?: unknown }> {
  const repo = getTaskFetcher();
  const task = await repo.getById(params.taskId as string);
  if (!task) return { error: "Tarefa não encontrada." };

  const { updateTaskAction } = await import("@/features/tasks/actions");
  const result = await updateTaskAction({
    id: task.id,
    tag: task.tag,
    title: params.title !== undefined ? (params.title as string) : task.title,
    description: params.description !== undefined ? (params.description as string) : task.description,
    priority: params.priority !== undefined ? (params.priority as "baixa" | "media" | "alta" | "critica") : task.priority,
    scheduledAt: params.scheduledAt !== undefined ? (params.scheduledAt as string) : task.scheduledAt,
    recurrence: task.recurrence,
    syncEnabled: task.syncEnabled,
    reminderOffsetsMinutes: task.reminderOffsetsMinutes ?? undefined,
    sharedWithUserId: task.sharedWithUserId ?? undefined,
  });

  if (result.error) return { error: result.error };
  return { error: null };
}

async function executeAddTaskStep(
  params: Record<string, unknown>,
): Promise<ActionResult & { result?: unknown }> {
  const { createTaskStepAction } = await import("@/features/tasks/actions");
  const result = await createTaskStepAction({
    taskId: params.taskId as string,
    title: params.title as string,
  });

  if (result.error) return { error: result.error };
  return { error: null, result: { stepId: result.id } };
}

async function executeStartExecution(
  params: Record<string, unknown>,
): Promise<ActionResult & { result?: unknown }> {
  const { startExecutionSessionAction } = await import("@/features/execution-companion/actions");
  const result = await startExecutionSessionAction({
    taskId: params.taskId as string,
  });

  if (result.error) return { error: result.error };
  return { error: null };
}
