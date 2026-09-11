import { z } from "zod";

import { validationSchema } from "@/validation/goal-schema";

import { IGoal } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { ChipOption } from "@/components";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IAddGoalProps {
  buttonText: string;
  connections: LoadAcceptedConnections.Model;
}

export interface IEditGoalProps {
  goalBeingEdited: IGoal;
  connections: LoadAcceptedConnections.Model;
}

export const PRIORITY_OPTIONS: ChipOption[] = [
  { label: "Baixa", value: "baixa", tone: "low" },
  { label: "Média", value: "media", tone: "medium" },
  { label: "Alta", value: "alta", tone: "high" },
  { label: "Crítica", value: "critica", tone: "critical" },
];

export const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};
