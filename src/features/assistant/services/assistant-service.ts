import "server-only";

import dayjs from "dayjs";

import { IAssistantMessage } from "@/features/assistant/domain";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { IMascotState } from "@/features/focus/domain";
import { getExecutionSessionFetcher } from "@/features/execution-companion/data/local-execution-session";
import type { IExecutionSession } from "@/features/execution-companion/domain/types";

import { pickTopMessage, RuleBasedAssistantProvider } from "./insight-provider";

export type IAssistantSnapshot =
  | { enabled: false; reducedPresence: boolean }
  | {
      enabled: true;
      reducedPresence: boolean;
      message: IAssistantMessage | null;
      mascot: IMascotState;
      executionSession: IExecutionSession | null;
      executionTaskTitle: string | null;
    };

/**
 * Snapshot 100% determinístico. NÃO chama Gemini.
 * Monta contexto a partir do banco/estado da aplicação.
 * Gemini entra SOMENTE sob demanda do usuário (chat, ações controladas).
 */
export class AssistantService {
  async getSnapshot(mascotFromLayout?: IMascotState): Promise<IAssistantSnapshot> {
    const preferences = await getAssistantPreferencesFetcher().getPreferences();

    if (!preferences.enabled) {
      return { enabled: false, reducedPresence: preferences.reducedPresence };
    }

    const [tasks, habits, goals, routine, fetchedMascot, executionSession] = await Promise.all([
      getTaskFetcher().loadAll(),
      getHabitFetcher().loadAll(),
      getGoalFetcher().loadAll(),
      getRoutineFetcher().loadAll(),
      mascotFromLayout ? Promise.resolve(mascotFromLayout) : getMascotFetcher().getMascot(),
      getExecutionSessionFetcher().getActiveOrPaused(),
    ]);
    const mascot = mascotFromLayout ?? fetchedMascot;

    // Deriva executionTaskTitle da Task atual (fonte de verdade),
    // NÃO de snapshot salvo. Se o título mudou, vemos o novo aqui.
    let executionTaskTitle: string | null = null;
    if (executionSession) {
      const task = await getTaskFetcher().getById(executionSession.taskId);
      executionTaskTitle = task?.title ?? null;
    }

    // Mensagem determinística baseada no estado real.
    // Sem chamada Gemini. Sem frase motivacional genérica.
    const message = this.buildDeterministicMessage(executionSession, executionTaskTitle);

    const finalMessage = message
      ? (await getAssistantPreferencesFetcher().registerInsightShown(message.text)).allowed
        ? message
        : null
      : null;

    return {
      enabled: true,
      reducedPresence: preferences.reducedPresence,
      message: finalMessage,
      mascot,
      executionSession,
      executionTaskTitle,
    };
  }

  /**
   * Monta mensagem a partir do estado atual — 100% determinística.
   * NÃO consome Gemini.
   */
  private buildDeterministicMessage(
    executionSession: IExecutionSession | null,
    taskTitle: string | null,
  ): IAssistantMessage | null {
    if (!executionSession) return null;

    const title = taskTitle ?? "sua tarefa";

    if (executionSession.status === "active") {
      return {
        id: "execution-active",
        tone: "info",
        text: `Você está fazendo: ${title}.`,
      };
    }

    if (executionSession.status === "paused") {
      return {
        id: "execution-paused",
        tone: "info",
        text: `Você estava fazendo: ${title}. Quer continuar?`,
      };
    }

    return null;
  }
}

export function getAssistantService() {
  return new AssistantService();
}
