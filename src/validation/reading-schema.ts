import { z } from "zod";

export const createReadingItemSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(200, "Título muito longo"),
  author: z.string().max(200, "Nome muito longo").optional().nullable(),
});

export const updateReadingItemSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["want_to_read", "reading", "finished"]),
  progressPercent: z.number().int().min(0).max(100, "Progresso deve ficar entre 0 e 100"),
});
