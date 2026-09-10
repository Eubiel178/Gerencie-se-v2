import { z } from "zod";

import { validationSchema } from "@/validation/routine-schema";

import { IRoutineItem } from "@/features/routine/domain";

export interface FormData extends z.infer<typeof validationSchema> {}

// Sentinela pro select de tarefa vinculada: `Input.FieldSelect` já usa
// value="" internamente pro placeholder desabilitado ("Selecione"), então
// a opção real "Nenhuma" (que precisa continuar selecionável depois de
// escolher e desfazer) usa este valor em vez de "".
export const NO_TASK_VALUE = "none";

export interface TaskOption {
  id: string;
  title: string;
}

export interface IAddRoutineItemProps {
  buttonText: string;
  taskOptions: TaskOption[];
}

export interface IEditRoutineItemProps {
  itemBeingEdited: IRoutineItem;
  taskOptions: TaskOption[];
}
