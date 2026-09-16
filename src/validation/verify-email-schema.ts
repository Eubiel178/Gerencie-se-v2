import { z } from "zod";

export const validationSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "O código tem 6 dígitos")
    .regex(/^\d{6}$/, "O código tem só números"),
});
