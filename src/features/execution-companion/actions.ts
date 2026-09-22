"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { executionSessions, tasks } from "@/db/schema";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import type { MascotPersonality } from "@/features/focus/domain";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { GeminiAssistantProvider } from "@/lib/ai/gemini-provider";
import type { CompanionInteractionContext } from "@/lib/ai/prompts/companion-context-prompt";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";
import {
  startExecutionSessionSchema,
  executionActionSchema,
} from "@/validation/execution-session-schema";

import { getExecutionSessionFetcher } from "./data/local-execution-session";
import type { IExecutionSession } from "./domain/types";

const taskOwnershipFilter = (userId: string) =>
  or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId));

/**
 * `task.work_status` e `execution_session.status` são DUAS fontes de
 * verdade que precisam concordar (uma tarefa "pausada" só faz sentido se
 * a sessão dela também está pausada, e vice-versa) - ver o raciocínio
 * completo em `pauseTaskExecutionAction` logo abaixo. Antes desta função,
 * cada mutação escrevia as duas tabelas em DUAS Server Actions
 * separadas (`setTaskWorkStatusAction` + `pauseExecutionSessionAction`,
 * por exemplo); cada uma tem seu próprio `revalidatePath`, e no App
 * Router do Next.js CADA Server Action chamada por um Client Component
 * já dispara sozinha uma nova busca dos Server Components da rota atual
 * (sem precisar de `router.refresh()` explícito). Duas ações = duas
 * buscas assíncronas independentes por clique, e entre a primeira escrita
 * e a segunda o banco ficava genuinamente inconsistente por um instante
 * (task já "paused", sessão ainda "active") - se a busca automática da
 * PRIMEIRA ação pousasse exatamente nesse instante, a lista inteira
 * recebia um retrato transitório inconsistente (achado relatado: "pausar
 * uma tarefa às vezes pausa/retoma todas", "os cards piscam"). Uma única
 * transação elimina a janela inconsistente por completo, e uma única
 * `revalidatePath` elimina a busca duplicada por clique.
 */
async function writeTaskAndSession(params: {
  userId: string;
  taskId: string;
  taskWorkStatus: "pending" | "in_progress" | "paused";
  sessionWrite:
    | { kind: "pause"; sessionId: string }
    | { kind: "resume"; sessionId: string }
    | { kind: "abandon"; sessionId: string }
    | null;
}): Promise<void> {
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({
        workStatus: params.taskWorkStatus,
        // `pausedAt` mora na PRÓPRIA task (não só na sessão) - ver
        // comentário completo em `src/db/schema.ts`. Sem isso, o card de
        // uma tarefa pausada perdia o "há quanto tempo" assim que outra
        // tarefa virasse a sessão rastreada no cliente.
        pausedAt: params.taskWorkStatus === "paused" ? now : null,
      })
      .where(and(eq(tasks.id, params.taskId), taskOwnershipFilter(params.userId)));

    if (!params.sessionWrite) return;

    if (params.sessionWrite.kind === "pause") {
      await tx
        .update(executionSessions)
        .set({ status: "paused", pausedAt: now, updatedAt: now })
        .where(
          and(
            eq(executionSessions.id, params.sessionWrite.sessionId),
            eq(executionSessions.userId, params.userId),
            eq(executionSessions.status, "active")
          )
        );
    } else if (params.sessionWrite.kind === "resume") {
      await tx
        .update(executionSessions)
        .set({ status: "active", pausedAt: null, resumedAt: now, updatedAt: now })
        .where(
          and(
            eq(executionSessions.id, params.sessionWrite.sessionId),
            eq(executionSessions.userId, params.userId),
            eq(executionSessions.status, "paused")
          )
        );
    } else {
      await tx
        .update(executionSessions)
        .set({ status: "abandoned", updatedAt: now })
        .where(
          and(
            eq(executionSessions.id, params.sessionWrite.sessionId),
            eq(executionSessions.userId, params.userId)
          )
        );
    }
  });
}

export async function startExecutionSessionAction(
  data: { taskId: string }
): Promise<ActionResult & { session?: IExecutionSession; switched?: boolean; previousTaskId?: string }> {
  const parsed = startExecutionSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const userId = await requireUserId();
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
    const now = new Date();

    if (existing) {
      if (existing.taskId === data.taskId) {
        return { error: "Essa tarefa já está em andamento." };
      }
      previousTaskId = existing.taskId;
      const newSessionId = crypto.randomUUID();

      // Pausar a sessão/tarefa antigas e criar a nova sessão numa ÚNICA
      // transação - mesmo raciocínio de `writeTaskAndSession` (nunca um
      // instante em que a tarefa antiga já mudou mas a sessão não, ou
      // vice-versa).
      await db.transaction(async (tx) => {
        await tx
          .update(executionSessions)
          .set({ status: "paused", pausedAt: now, updatedAt: now })
          .where(and(eq(executionSessions.userId, userId), eq(executionSessions.status, "active")));

        await tx
          .update(tasks)
          .set({ workStatus: "paused", pausedAt: now })
          .where(and(eq(tasks.id, existing.taskId), taskOwnershipFilter(userId)));

        await tx.insert(executionSessions).values({
          id: newSessionId,
          userId,
          taskId: data.taskId,
          status: "active",
          currentStepIndex: 0,
          startedAt: now,
          resumedAt: now,
          updatedAt: now,
        });
      });

      const created = await repo.getById(newSessionId);
      if (!created) return { error: "Não foi possível criar a sessão de execução." };
      session = created;
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

export async function pauseTaskExecutionAction(
  data: { taskId: string; sessionId: string }
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await writeTaskAndSession({
      userId,
      taskId: data.taskId,
      taskWorkStatus: "paused",
      sessionWrite: { kind: "pause", sessionId: data.sessionId },
    });

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível pausar a tarefa. Tente novamente." };
  }
}

export async function resumeTaskExecutionAction(
  data: { taskId: string; sessionId: string }
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await writeTaskAndSession({
      userId,
      taskId: data.taskId,
      taskWorkStatus: "in_progress",
      sessionWrite: { kind: "resume", sessionId: data.sessionId },
    });

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível retomar a tarefa. Tente novamente." };
  }
}

export async function abandonTaskExecutionAction(
  data: { taskId: string; sessionId: string }
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await writeTaskAndSession({
      userId,
      taskId: data.taskId,
      taskWorkStatus: "pending",
      sessionWrite: { kind: "abandon", sessionId: data.sessionId },
    });

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return { error: null };
  } catch {
    return { error: "Não foi possível abandonar a sessão. Tente novamente." };
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

/**
 * Orquestra UMA interação espontânea do Companion de ponta a ponta,
 * server-side, numa ÚNICA chamada:
 *
 *   cota (leitura) → tenta IA (se elegível) → cai pro local se preciso
 *   → registra cota (escrita) → loga observabilidade → devolve
 *
 * `written`/`spoken` SEMPRE nascem desta MESMA chamada, nunca de
 * chamadas separadas - é isso que impede o balão mostrar uma coisa
 * enquanto o TTS fala outra. O CLIENTE (`use-tasks-companion.ts`) só
 * decide QUANDO vale a pena chamar isto (política de prioridade/
 * cooldown) e monta o CONTEXTO real; toda decisão de "local ou IA" e o
 * controle de cota moram aqui, no servidor, perto da chave de API e do
 * gateway de failover.
 */
export async function resolveCompanionMessageAction(params: {
  intent: string;
  priority: "meaningful" | "casual";
  aiEligible: boolean;
  personality: MascotPersonality;
  context: CompanionInteractionContext;
  localFallback: { written: string; spoken: string };
}): Promise<{ allowed: boolean; phrase?: { written: string; spoken: string }; source?: "local" | "ai" }> {
  try {
    const prefs = getAssistantPreferencesFetcher();

    // Checagem só de leitura ANTES de gastar uma chamada de IA cara -
    // sem sentido gerar uma interação se a cota já estourou mesmo.
    const hasBudget = await prefs.hasCompanionBudget(params.priority);
    if (!hasBudget) {
      console.log(`[Companion] intent=${params.intent} decision=silent reason=budget_exhausted priority=${params.priority}`);
      return { allowed: false };
    }

    let phrase = params.localFallback;
    let source: "local" | "ai" = "local";

    if (params.aiEligible) {
      const ai = new GeminiAssistantProvider();
      const generated = await ai.generateCompanionInteraction(params.context, params.personality);
      if (generated) {
        phrase = generated;
        source = "ai";
      }
    }

    const { allowed } = await prefs.registerCompanionMessageShown(phrase.written, params.priority);

    console.log(
      `[Companion] intent=${params.intent} decision=${allowed ? "speak" : "silent"} ` +
        `${allowed ? `source=${source} ` : ""}priority=${params.priority} taskTitle="${params.context.taskTitle}"` +
        `${allowed ? "" : " reason=budget_exhausted_after_generation"}`
    );

    if (!allowed) return { allowed: false };
    return { allowed: true, phrase, source };
  } catch (error) {
    console.error("[Companion] erro ao resolver interação:", error);
    // Falha fechada (silêncio) - mesmo padrão do resto do app: um erro
    // do servidor nunca deveria arriscar mostrar mais coisa do que o
    // planejado, só menos.
    return { allowed: false };
  }
}
