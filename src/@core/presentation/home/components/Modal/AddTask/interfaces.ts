import { z } from "zod";
import { validationSchema } from "@/validation/taskSchema";

export interface IModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export interface FormData extends z.infer<typeof validationSchema> {}
