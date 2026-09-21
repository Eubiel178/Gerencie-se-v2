import { z } from "zod";

import { LoadAcceptedConnections } from "@/features/connections/domain";
import { IHabit } from "@/features/habits/domain";
import { validationSchema } from "@/validation/habit-schema";


export interface FormData extends z.infer<typeof validationSchema> {}

// Sentinela pro select de objetivo vinculado — mesmo raciocínio do
// `NO_TASK_VALUE` da Rotina: `Input.FieldSelect` já usa value="" pro
// placeholder desabilitado, então "Nenhum" precisa de outro valor.
export const NO_GOAL_VALUE = "none";

export interface GoalOption {
  id: string;
  title: string;
}

export interface IAddHabitProps {
  buttonText: string;
  connections: LoadAcceptedConnections.Model;
  goalOptions: GoalOption[];
}

export interface IEditHabitProps {
  habitBeingEdited: IHabit;
  connections: LoadAcceptedConnections.Model;
  goalOptions: GoalOption[];
}
