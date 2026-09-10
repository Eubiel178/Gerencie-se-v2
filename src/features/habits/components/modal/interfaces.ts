import { z } from "zod";

import { validationSchema } from "@/validation/habit-schema";

import { IHabit } from "@/features/habits/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IAddHabitProps {
  buttonText: string;
  connections: LoadAcceptedConnections.Model;
}

export interface IEditHabitProps {
  habitBeingEdited: IHabit;
  connections: LoadAcceptedConnections.Model;
}
