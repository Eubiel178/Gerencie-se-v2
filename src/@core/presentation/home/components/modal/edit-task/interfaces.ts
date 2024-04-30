import { z } from "zod";

import { validationSchema } from "@/validation/taskSchema";

import { ITask } from "@/@core/domain";

export interface IModalProps {
  taskBeingEdited: ITask;
}

export interface FormData extends z.infer<typeof validationSchema> {}
