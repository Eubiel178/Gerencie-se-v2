import { z } from "zod";

import { validationSchema } from "@/validation/goal-schema";

import { IGoal } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

export { PRIORITY_OPTIONS, PRIORITY_LABELS } from "@/lib/priority";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IAddGoalProps {
  buttonText: string;
  connections: LoadAcceptedConnections.Model;
}

export interface IEditGoalProps {
  goalBeingEdited: IGoal;
  connections: LoadAcceptedConnections.Model;
}
