import { z } from "zod";

export const validationSchema = z.object({
  tag: z.enum(["studie", "work", "exercise", "other"]),
  title: z.string().min(1, "Campo obrigatório"),
  description: z.string().min(1, "Campo obrigatório"),
});
