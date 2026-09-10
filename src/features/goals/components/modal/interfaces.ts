import { z } from "zod";

import { validationSchema } from "@/validation/goal-schema";

import { IGoal } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IAddGoalProps {
  buttonText: string;
  connections: LoadAcceptedConnections.Model;
}

export interface IEditGoalProps {
  goalBeingEdited: IGoal;
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
