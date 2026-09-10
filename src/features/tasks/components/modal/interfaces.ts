import { z } from "zod";

import { validationSchema } from "@/validation/task-schema";

import { ITask } from "@/features/tasks/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

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

export const PRIORITY_OPTIONS = [
  { label: "Baixa", value: "baixa" },
  { label: "Média", value: "media" },
  { label: "Alta", value: "alta" },
  { label: "Crítica", value: "critica" },
];

export const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};
