import { z } from "zod";
import { validationSchema } from "@/validation/event-schema";

export interface IModalProps {
  buttonText: string;
}

export interface FormData extends z.infer<typeof validationSchema> {}
