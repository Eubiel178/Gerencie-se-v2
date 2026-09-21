"use server";

import { getExecutionSessionFetcher } from "@/features/execution-companion/data/local-execution-session";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { isAIProviderAvailable } from "@/lib/ai/gateway";
import { askGemini } from "@/lib/ai/gemini";
import { buildChatSystemPrompt } from "@/lib/ai/prompts/chat-prompt";

import { buildContextualFallback } from "./lib/companion-fallback";

export interface ChatResult {
  success: boolean;
  message: string;
  proposal?: {
    action: string;
    params: Record<string, unknown>;
    confidence: number;
    risk: string;
    requiresConfirmation: boolean;
  };
}

const fallbackDeps = {
  async getActiveSession() {
    const session = await getExecutionSessionFetcher().getActive();
    if (!session) return null;
    return { taskId: session.taskId, status: session.status, currentStepIndex: session.currentStepIndex };
  },
  async getTaskById(id: string) {
    const task = await getTaskFetcher().getById(id);
    if (!task) return null;
    return { title: task.title, steps: task.steps ?? [] };
  },
};

/**
 * Monta contexto estruturado da sessão de execução atual.
 * Inclui: tarefa ativa, passos, status — tudo do DB, não do chat.
 */
async function buildExecutionContext(): Promise<string> {
  try {
    const session = await getExecutionSessionFetcher().getActiveOrPaused();
    if (!session) return "";

    const task = await getTaskFetcher().getById(session.taskId);
    if (!task) return "";

    const completedSteps = task.steps.filter((s) => s.completed);

    const lines: string[] = [];
    lines.push(`TAREFA ATUAL: "${task.title}"`);
    if (task.description) lines.push(`Descrição: ${task.description}`);
    lines.push(`Status da sessão: ${session.status === "active" ? "em execução" : "pausada"}`);
    lines.push(`Prioridade: ${task.priority}`);

    if (task.steps.length > 0) {
      lines.push(`Passos (${completedSteps.length}/${task.steps.length} concluídos):`);
      for (const step of task.steps) {
        lines.push(`  ${step.completed ? "[x]" : "[ ]"} ${step.title}`);
      }
    } else {
      lines.push("Essa tarefa não tem passos cadastrados.");
    }

    return lines.join("\n");
  } catch {
    return "";
  }
}

/**
 * Server action unificada: UMA chamada Gemini por mensagem.
 * 1. Tenta interpretar como ação controlada (se Gemini disponível)
 * 2. Se ação detectada → retorna proposal
 * 3. Se não → gera resposta de chat com contexto
 * 4. Se Gemini indisponível → fallback context-aware com dados locais
 */
export async function sendAssistantMessage(
  message: string,
  history?: Array<{ role: "user" | "mascot"; text: string }>,
): Promise<ChatResult> {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return { success: false, message: "Digite uma mensagem." };
  }

  if (cleanMessage.length > 1000) {
    return { success: false, message: "Mensagem muito longa." };
  }

  // Se Gemini indisponível (cooldown/rate limit/sem key), vai direto pro fallback
  if (!isAIProviderAvailable()) {
    const fallback = await buildContextualFallback(cleanMessage, fallbackDeps);
    return { success: true, message: fallback };
  }

  try {
    // 1. Carregar personalidade + contexto factual em paralelo
    const [mascot, executionContext] = await Promise.all([
      getMascotFetcher().getMascot(),
      buildExecutionContext(),
    ]);
    const personality = mascot?.personality ?? "zen";

    // 2. Resposta de chat COM contexto (sem interpretIntention — mutations desabilitadas nesta fase)
    const systemInstruction = buildChatSystemPrompt(personality, executionContext);
    const chatHistory = history?.map((m) => ({
      role: m.role === "mascot" ? "assistant" as const : "user" as const,
      content: m.text,
    }));
    const response = await askGemini(cleanMessage, systemInstruction, chatHistory);
    if (response) {
      return { success: true, message: response.text };
    }
    // Gemini indisponível → fallback context-aware
    const fallback = await buildContextualFallback(cleanMessage, fallbackDeps);
    return { success: true, message: fallback };
  } catch (e) {
    console.error("[sendAssistantMessage] erro inesperado:", e);
    try {
      const fallback = await buildContextualFallback(cleanMessage, fallbackDeps);
      return { success: true, message: fallback };
    } catch {
      return { success: true, message: "Tô sem condições de responder agora. Tenta de novo em instantes." };
    }
  }
}
