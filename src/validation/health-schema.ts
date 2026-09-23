import { z } from "zod";

export const createHealthCheckupSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(120, "Título muito longo"),
  category: z.string().min(1, "Campo obrigatório").max(60, "Categoria muito longa"),
  intervalDays: z.number().int().positive("Intervalo deve ser maior que zero").optional().nullable(),
  notes: z.string().max(500, "Nota muito longa").optional().nullable(),
});

export const updateHealthCheckupSchema = createHealthCheckupSchema;

// Schema pro FORMULÁRIO (campo numérico como string, jeito que um
// `<input type="number">` de fato entrega o valor) — mesmo padrão de
// `targetPerWeek` em `habit-schema.ts`. Convertido pra `number|null` só
// na hora de chamar a Server Action, nunca no schema em si.
export const healthCheckupFormSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(120, "Título muito longo"),
  category: z.string().min(1, "Campo obrigatório").max(60, "Categoria muito longa"),
  intervalDays: z.string().optional(),
  notes: z.string().max(500, "Nota muito longa").optional(),
});

export type HealthCheckupFormData = z.infer<typeof healthCheckupFormSchema>;
