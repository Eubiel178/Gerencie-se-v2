import { z } from "zod";

import { validationSchema } from "@/validation/eventSchema";

export interface IModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  eventBeingEdited: any;
}

export interface FormData extends z.infer<typeof validationSchema> {}
