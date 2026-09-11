import "server-only";

import { IAssistantMessage, IAssistantPreferences } from "@/features/assistant/domain";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";

import { pickTopMessage, RuleBasedAssistantProvider } from "./insight-provider";

export interface IAssistantSnapshot {
  enabled: boolean;
  reducedPresence: boolean;
  message: IAssistantMessage | null;
  preferences: IAssistantPreferences;
}

/**
 * Único ponto de entrada do JARVIS para o resto da aplicação. Nunca acessa
 * o banco diretamente — só conversa com os serviços (fetchers) que cada
 * feature já expõe, exatamente como o plano original pedia:
 *
 *   AssistantService → TasksService, HabitsService, GoalsService,
 *                       RoutineService, FocusService (mascote)
 *
 * Trocar o "cérebro" (hoje `RuleBasedAssistantProvider`) por um provedor
 * de IA de verdade no futuro não muda nada aqui além de qual provider é
 * instanciado.
 */
export class AssistantService {
  async getSnapshot(): Promise<IAssistantSnapshot> {
    const preferences = await getAssistantPreferencesFetcher().getPreferences();

    if (!preferences.enabled) {
      return { enabled: false, reducedPresence: preferences.reducedPresence, message: null, preferences };
    }

    const [tasks, habits, goals, routine, mascot] = await Promise.all([
      getTaskFetcher().loadAll(),
      getHabitFetcher().loadAll(),
      getGoalFetcher().loadAll(),
      getRoutineFetcher().loadAll(),
      getMascotFetcher().getMascot(),
    ]);

    const messages = new RuleBasedAssistantProvider().buildMessages({
      tasks,
      habits,
      goals,
      routine,
      mascot,
    });

    return {
      enabled: true,
      reducedPresence: preferences.reducedPresence,
      message: pickTopMessage(messages),
      preferences,
    };
  }
}

export function getAssistantService() {
  return new AssistantService();
}
