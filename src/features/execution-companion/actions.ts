"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { executionSessions, tasks } from "@/db/schema";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import type { MascotPersonality } from "@/features/focus/domain";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { TASK_START_XP } from "@/features/tasks/data/local-task";
import { GeminiAssistantProvider } from "@/lib/ai/gemini-provider";
import type { CompanionInteractionContext } from "@/lib/ai/prompts/companion-context-prompt";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";
import {
  startExecutionSessionSchema,
  executionActionSchema,
} from "@/validation/execution-session-schema";

import { getExecutionSessionFetcher } from "./data/local-execution-session";
import { type CompanionActionOption, type CompanionMove, QUIET_SAFE_MOVES, getActionsForMove } from "./domain/companion-moves";
import type { IExecutionSession } from "./domain/types";

// Duração fixa do limite de espaço, contada a partir da resposta
// EXPLÍCITA "sim" à pergunta do próprio Companion (`ask-quiet-check`) -
// nunca inferida de fechamentos manuais. Fixa de propósito (não varia
// por personalidade): é um limite de verdade, não uma questão de tom -
// ver `companion-personality-profile.ts` pro que VARIA por personalidade
// (a recuperação depois de um "não", que é sobre insistência, não limite).
const QUIET_DURATION_MS = 60 * 60 * 1000;

// XP por criar/alternar uma sessão de execução (toda vez que uma execução
// começa ou uma outra tarefa vira a ativa). Compartilhado entre
// `startExecutionSessionAction` e `startTaskExecutionAction`.
const SESSION_START_XP = 5;

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

    await getMascotFetcher().addXp(SESSION_START_XP);

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

export type StartTaskExecutionResult = ActionResult & {
  session?: IExecutionSession;
  switched?: boolean;
  previousTaskId?: string;
  taskStartedAt?: Date | null;
  taskWorkStatus?: "pending" | "in_progress" | "paused";
  taskPausedAt?: Date | null;
};

/**
 * "Começar"/"Retomar" numa ÚNICA ida ao servidor.
 *
 * Antes, o card executava duas Server Actions em sequência:
 *   - "Começar": `markTaskStartedAction` → depois `startExecutionSessionAction`;
 *   - "Retomar com troca de tarefa": `setTaskWorkStatusAction` → depois
 *     `startExecutionSessionAction`.
 * Cada uma tinha o próprio `revalidatePath` — 2 round-trips de rede pro
 * cliente e 4 revalidações por clique. Esta ação combina os dois efeitos:
 *
 *   1. marca a tarefa como iniciada (idempotente, mesmo raciocínio de
 *      `LocalTask.markStarted`: `startedAt` só preenchido na 1ª vez,
 *      `work_status` = `in_progress`, `pausedAt` limpo);
 *   2. cria a sessão ativa da tarefa — alternando (pausando a sessão ativa
 *      anterior + a própria tarefa dela) se houver outra em andamento;
 *
 * com TODO o estado do banco numa única transação. O servidor segue a fonte
 * de verdade: o client atualiza task/sessão a partir do retorno.
 *
 * XP preservado na mesma quantidade e condição de antes:
 *   - `TASK_START_XP` só quando a tarefa é iniciada pela 1ª vez (não recontado
 *     em retomar/recomeçar);
 *   - `SESSION_START_XP` sempre que uma sessão de execução é criada/alternada.
 */
export async function startTaskExecutionAction(
  data: { taskId: string }
): Promise<StartTaskExecutionResult> {
  const parsed = startExecutionSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const userId = await requireUserId();
    const repo = getExecutionSessionFetcher();
    const task = await getTaskFetcher().getById(data.taskId);

    if (!task) {
      return { error: "Tarefa não encontrada." };
    }

    const existing = await repo.getActive();
    if (existing?.taskId === data.taskId) {
      return { error: "Essa tarefa já está em andamento." };
    }

    const firstStart = !task.startedAt;
    const now = new Date();
    const sessionId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      // 1) Marca a tarefa alvo como iniciada (idempotente) e em execução.
      await tx
        .update(tasks)
        .set({
          startedAt: task.startedAt ?? now,
          workStatus: "in_progress",
          pausedAt: null,
        })
        .where(and(eq(tasks.id, data.taskId), taskOwnershipFilter(userId)));

      // 2) Alternância: pausa a sessão ativa atual e a tarefa dela.
      if (existing) {
        await tx
          .update(executionSessions)
          .set({ status: "paused", pausedAt: now, updatedAt: now })
          .where(
            and(
              eq(executionSessions.userId, userId),
              eq(executionSessions.status, "active")
            )
          );

        await tx
          .update(tasks)
          .set({ workStatus: "paused", pausedAt: now })
          .where(
            and(eq(tasks.id, existing.taskId), taskOwnershipFilter(userId))
          );
      }

      // 3) Sessão ativa da tarefa alvo.
      await tx.insert(executionSessions).values({
        id: sessionId,
        userId,
        taskId: data.taskId,
        status: "active",
        currentStepIndex: 0,
        startedAt: now,
        resumedAt: now,
        updatedAt: now,
      });
    });

    const session = await repo.getById(sessionId);
    if (!session) {
      return { error: "Não foi possível criar a sessão de execução." };
    }

    if (firstStart) {
      await getMascotFetcher().addXp(TASK_START_XP);
    }
    await getMascotFetcher().addXp(SESSION_START_XP);

    revalidatePath("/home");
    revalidatePath("/home/tasks");

    return {
      error: null,
      session,
      switched: !!existing,
      previousTaskId: existing?.taskId,
      taskStartedAt: task.startedAt ?? now,
      taskWorkStatus: "in_progress",
      taskPausedAt: null,
    };
  } catch {
    return { error: "Não foi possível iniciar a execução da tarefa. Tente novamente." };
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
  /** Ver `frequencyBypass` em `companion-interaction-config.ts` -
   * ignora o intervalo mínimo desde a última fala (nunca o freio de
   * emergência) pra situações raras o bastante que vale a pena falar
   * mesmo logo após outra fala. */
  frequencyBypass: boolean;
  /** Se o usuário está conversando ativamente no chat do Widget agora -
   * o histórico de chat vive só no `localStorage` do cliente, o
   * servidor não tem como saber isso sozinho (ver
   * `isEngagedViaChat()` em `use-tasks-companion.ts`). */
  isEngagedViaChat: boolean;
  aiEligible: boolean;
  personality: MascotPersonality;
  context: Omit<CompanionInteractionContext, "eligibleMoves" | "humorEligible">;
  /** Movimentos candidatos já filtrados por SITUAÇÃO + PERSONALIDADE +
   * janela de recuo (ver `computeCandidateMoves`, calculado no cliente -
   * puro, sem precisar de DB). Este servidor ainda aplica o único filtro
   * que só ele conhece (o limite de espaço persistido) por cima disso -
   * a IA nunca vê nem escolhe fora do resultado final. */
  candidateMoves: CompanionMove[];
  humorEligible: boolean;
  localFallback: { written: string; spoken: string };
}): Promise<{
  allowed: boolean;
  phrase?: { written: string; spoken: string };
  source?: "local" | "ai";
  move?: CompanionMove;
  actions?: CompanionActionOption[];
}> {
  try {
    const prefs = getAssistantPreferencesFetcher();

    // Limite de espaço: casual fica mudo por completo; meaningful só
    // pode usar os movimentos mais discretos (ver QUIET_SAFE_MOVES) -
    // aplicado ANTES de qualquer chamada de IA, então o modelo nunca
    // sequer VÊ um movimento fora do que o limite permite agora.
    const quietUntil = await prefs.getCompanionQuietUntil();
    let eligibleMoves = params.candidateMoves;
    if (quietUntil) {
      if (params.priority === "casual") {
        console.log(`[Companion] intent=${params.intent} decision=silent reason=quiet_boundary priority=casual`);
        return { allowed: false };
      }
      eligibleMoves = eligibleMoves.filter((m) => QUIET_SAFE_MOVES.includes(m));
    }

    if (eligibleMoves.length === 0) {
      console.log(`[Companion] intent=${params.intent} decision=silent reason=no_eligible_move`);
      return { allowed: false };
    }

    // Checagem só de leitura ANTES de gastar uma chamada de IA cara -
    // sem sentido gerar uma interação se a cota já estourou mesmo.
    const hasBudget = await prefs.hasCompanionBudget({
      priority: params.priority,
      frequencyBypass: params.frequencyBypass,
      isEngagedViaChat: params.isEngagedViaChat,
    });
    if (!hasBudget) {
      console.log(`[Companion] intent=${params.intent} decision=silent reason=budget_exhausted priority=${params.priority}`);
      return { allowed: false };
    }

    let phrase: { written: string; spoken: string } = params.localFallback;
    let source: "local" | "ai" = "local";
    let move: CompanionMove = eligibleMoves[0];

    if (params.aiEligible) {
      const ai = new GeminiAssistantProvider();
      const generated = await ai.generateCompanionInteraction(
        { ...params.context, eligibleMoves, humorEligible: params.humorEligible },
        params.personality
      );
      if (generated) {
        phrase = { written: generated.written, spoken: generated.spoken };
        source = "ai";
        move = generated.move as CompanionMove;
      }
    }

    // PONTO ÚNICO de normalização da mensagem canônica: venha a frase do
    // fallback local OU da IA, `spoken` é sempre forçado ao MESMO texto de
    // `written` aqui antes de qualquer entrega ao resto do app. É isso que
    // garante que balão e voz nunca mais divergem (compatibilidade
    // temporária: o campo duplicado está em remoção, ver `CompanionPhrase`).
    phrase = { written: phrase.written, spoken: phrase.written };

    const { allowed } = await prefs.registerCompanionMessageShown(phrase.written, {
      priority: params.priority,
      frequencyBypass: params.frequencyBypass,
      isEngagedViaChat: params.isEngagedViaChat,
    });

    console.log(
      `[Companion] intent=${params.intent} decision=${allowed ? "speak" : "silent"} ` +
        `${allowed ? `source=${source} move=${move} ` : ""}priority=${params.priority} taskTitle="${params.context.taskTitle}"` +
        `${allowed ? "" : " reason=budget_exhausted_after_generation"}`
    );

    if (!allowed) return { allowed: false };
    return { allowed: true, phrase, source, move, actions: getActionsForMove(move, params.personality) };
  } catch (error) {
    console.error("[Companion] erro ao resolver interação:", error);
    // Falha fechada (silêncio) - mesmo padrão do resto do app: um erro
    // do servidor nunca deveria arriscar mostrar mais coisa do que o
    // planejado, só menos.
    return { allowed: false };
  }
}

/**
 * Só chamada depois que o próprio usuário responde "sim" à pergunta do
 * Companion (`ask-quiet-check`) - nunca automaticamente. Duração fixa
 * (`QUIET_DURATION_MS`), sem forma de cancelar antes da hora: expira
 * sozinho (pedido explícito - "deixar expirar naturalmente").
 */
export async function setCompanionQuietAction(): Promise<ActionResult> {
  try {
    const prefs = getAssistantPreferencesFetcher();
    await prefs.setCompanionQuietUntil(new Date(Date.now() + QUIET_DURATION_MS));
    return { error: null };
  } catch {
    return { error: "Não foi possível registrar a preferência agora." };
  }
}
