import { z } from "zod";

import { validationSchema } from "@/validation/taskSchema";

export type FormData = z.infer<typeof validationSchema>;

export interface IModalProps {
  buttonText: string;
}
