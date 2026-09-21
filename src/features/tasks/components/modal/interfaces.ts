import { z } from "zod";

import { LoadAcceptedConnections } from "@/features/connections/domain";
import { ITask } from "@/features/tasks/domain";
import { validationSchema } from "@/validation/task-schema";


export { PRIORITY_OPTIONS, PRIORITY_LABELS } from "@/lib/shared/priority";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IEditTaskProps {
  taskBeingEdited: ITask;
  // Se o usuário já conectou o Google Agenda — decide se marcar
  // "Sincronizar" funciona direto ou se mostra o prompt pra conectar
  // primeiro. Vem do Server Component (`Home`), nunca é buscado pelo
  // Client Component (evita expor detalhes da conexão no cliente).
  isGoogleConnected: boolean;
  connections: LoadAcceptedConnections.Model;
}

export interface IAddTaskProps {
  buttonText: string;
  isGoogleConnected: boolean;
  connections: LoadAcceptedConnections.Model;
}
