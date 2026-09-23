import { z } from "zod";

export const createCycleEntrySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida (AAAA-MM-DD)")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Informe uma data válida"),
  periodLengthDays: z
    .number()
    .int()
    .positive("Duração deve ser maior que zero")
    .max(30, "Duração muito alta")
    .optional()
    .nullable(),
  symptoms: z.array(z.string().max(60)).max(30, "Muitos sintomas"),
  notes: z.string().max(500, "Nota muito longa").optional().nullable(),
});
