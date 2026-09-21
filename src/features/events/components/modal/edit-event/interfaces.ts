import { z } from "zod";

import { IEvent } from "@/features/events/domain";
import { validationSchema } from "@/validation/event-schema";


export interface IModalProps {
  eventBeingEdited: IEvent;
}

export interface FormData extends z.infer<typeof validationSchema> {}
