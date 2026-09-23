import { IMascotState } from "@/features/focus/domain";
import { IGoal } from "@/features/goals/domain";
import { IHabit } from "@/features/habits/domain";
import { IRoutineItem } from "@/features/routine/domain";
import { ITask } from "@/features/tasks/domain";

/** Todo o dado que o assistente pode "ver" para gerar uma mensagem — vem
 * sempre dos serviços de cada feature (nunca de uma query direta), ver
 * `AssistantService`. */
export interface IAssistantContext {
  tasks: ITask[];
  habits: IHabit[];
  goals: IGoal[];
  routine: IRoutineItem[];
  mascot: IMascotState;
  now?: Date;
}
