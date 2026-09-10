import { z } from "zod";

export const createHealthCheckupSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(120, "Título muito longo"),
  category: z.string().min(1, "Campo obrigatório").max(60, "Categoria muito longa"),
  intervalDays: z.number().int().positive("Intervalo deve ser maior que zero").optional().nullable(),
  notes: z.string().max(500, "Nota muito longa").optional().nullable(),
});
