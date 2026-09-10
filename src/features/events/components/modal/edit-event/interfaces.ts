import { z } from "zod";

import { validationSchema } from "@/validation/event-schema";

import { IEvent } from "@/features/events/domain";

export interface IModalProps {
  eventBeingEdited: IEvent;
}

export interface FormData extends z.infer<typeof validationSchema> {}
