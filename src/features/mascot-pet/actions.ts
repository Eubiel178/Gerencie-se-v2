"use server";

import { askGemini } from "@/lib/ai/gemini";
import { isAIProviderAvailable } from "@/lib/ai/gateway";
import { GeminiAssistantProvider } from "@/lib/ai/gemini-provider";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getExecutionSessionFetcher } from "@/features/execution-companion/data/local-execution-session";
import { getCompanionAction } from "@/features/execution-companion/domain/actions";
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
 * Server action unificada: UMA chamada Gemini por mensagem.
 * 1. Tenta interpretar como ação controlada (se Gemini disponível)
 * 2. Se ação detectada → retorna proposal
 * 3. Se não → gera resposta de chat
 * 4. Se Gemini indisponível → fallback context-aware com dados locais
 */
export async function sendAssistantMessage(message: string): Promise<ChatResult> {
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
    // 1. Tentar interpretar como ação (UMA chamada Gemini)
    const mascot = await getMascotFetcher().getMascot();
    const personality = mascot?.personality ?? "zen";

    const gemini = new GeminiAssistantProvider();
    const interpreted = await gemini.interpretIntention({
      message: cleanMessage,
      personality,
    });

    if (interpreted && interpreted.action && interpreted.confidence >= 0.5) {
      const actionDef = getCompanionAction(interpreted.action);
      return {
        success: true,
        message: "", // vazio — Widget mostra card de proposta
        proposal: {
          action: interpreted.action,
          params: interpreted.params,
          confidence: interpreted.confidence,
          risk: actionDef?.risk ?? "low",
          requiresConfirmation: actionDef?.requiresConfirmation ?? true,
        },
      };
    }

    // 2. Não é ação → resposta de chat
    const response = await askGemini(cleanMessage);
    if (response) {
      return { success: true, message: response.text };
    }
    // Gemini indisponível após interpretIntention → fallback context-aware
    const fallback = await buildContextualFallback(cleanMessage, fallbackDeps);
    return { success: true, message: fallback };
  } catch (e) {
    console.error("[sendAssistantMessage] erro inesperado:", e);
    const fallback = await buildContextualFallback(cleanMessage, fallbackDeps);
    return { success: true, message: fallback };
  }
}
