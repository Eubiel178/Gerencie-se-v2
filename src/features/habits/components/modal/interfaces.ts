import { z } from "zod";

import { validationSchema } from "@/validation/habit-schema";

import { IHabit } from "@/features/habits/domain";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IAddHabitProps {
  buttonText: string;
}

export interface IEditHabitProps {
  habitBeingEdited: IHabit;
}
