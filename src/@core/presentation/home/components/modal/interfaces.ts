import { z } from "zod";

import { validationSchema } from "@/validation/taskSchema";

import { ITask } from "@/@core/domain";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IEditTaskProps {
  taskBeingEdited: ITask;
}

export interface IAddTaskProps {
  buttonText: string;
}
