import { z } from "zod";
import { validationSchema } from "@/validation/eventSchema";

export interface IModalProps {
  buttonText: string;
}

export interface FormData extends z.infer<typeof validationSchema> {}
