import { z } from "zod";

import { LoadAcceptedConnections } from "@/features/connections/domain";
import { IGoal } from "@/features/goals/domain";
import { validationSchema } from "@/validation/goal-schema";


export { PRIORITY_OPTIONS, PRIORITY_LABELS } from "@/lib/shared/priority";

export interface FormData extends z.infer<typeof validationSchema> {}

export interface IAddGoalProps {
  buttonText: string;
  connections: LoadAcceptedConnections.Model;
}

export interface IEditGoalProps {
  goalBeingEdited: IGoal;
  connections: LoadAcceptedConnections.Model;
}
