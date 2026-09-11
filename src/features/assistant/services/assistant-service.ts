import "server-only";

import { IAssistantMessage } from "@/features/assistant/domain";
import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { IMascotState } from "@/features/focus/domain";

import { pickTopMessage, RuleBasedAssistantProvider } from "./insight-provider";

// União discriminada por `enabled`: quando `false`, `Assistant` nem chega
// a montar o widget, então não faz sentido nenhum outro campo além de
// `reducedPresence` (mantido pra Configurações continuar refletindo o
// estado do toggle mesmo desabilitado). Quando `true`, `mascot` é
// obrigatório — o widget do assistente É o mascote (mesmo nome/espécie/
// personalidade/voz), não um segundo personagem à parte.
export type IAssistantSnapshot =
  | { enabled: false; reducedPresence: boolean }
  | {
      enabled: true;
      reducedPresence: boolean;
      message: IAssistantMessage | null;
      mascot: IMascotState;
    };

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
      return { enabled: false, reducedPresence: preferences.reducedPresence };
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
      mascot,
    };
  }
}

export function getAssistantService() {
  return new AssistantService();
}
