import { z } from "zod";

import { validationSchema } from "@/validation/event-schema";

import { IEvent } from "@/@core/domain";

export interface IModalProps {
  eventBeingEdited: IEvent;
}

export interface FormData extends z.infer<typeof validationSchema> {}
