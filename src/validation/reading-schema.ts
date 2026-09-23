import { z } from "zod";

const optionalPositiveInteger = z.number().int().positive().nullable().optional();
const optionalNonNegativeInteger = z.number().int().min(0).nullable().optional();

export const createReadingItemSchema = z.object({
  title: z.string().min(1, "Campo obrigatório").max(200, "Título muito longo"),
  author: z.string().max(200, "Nome muito longo").optional().nullable(),
  totalPages: optionalPositiveInteger,
  currentPage: optionalNonNegativeInteger,
  dailyReadingGoal: optionalPositiveInteger,
}).superRefine((data, context) => {
  if (
    data.totalPages != null &&
    data.currentPage != null &&
    data.currentPage > data.totalPages
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currentPage"],
      message: "A página atual não pode ser maior que o total de páginas.",
    });
  }
});

export const updateReadingItemSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["want_to_read", "reading", "finished"]),
  progressPercent: z.number().int().min(0).max(100, "Progresso deve ficar entre 0 e 100"),
});

export const updateReadingCurrentPageSchema = z.object({
  id: z.string().min(1),
  currentPage: z.number().int().min(0, "Informe uma página válida."),
});

export const updateReadingDetailsSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "Informe o título do livro.").max(200, "Título muito longo"),
  author: z.string().trim().max(200, "Nome muito longo").nullable(),
  status: z.enum(["want_to_read", "reading", "finished"]),
  totalPages: optionalPositiveInteger,
  currentPage: optionalNonNegativeInteger,
  dailyReadingGoal: optionalPositiveInteger,
}).superRefine((data, context) => {
  if (data.totalPages == null && data.currentPage != null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["totalPages"],
      message: "Informe o total de páginas para registrar a página atual.",
    });
  }

  if (data.totalPages != null && data.currentPage != null && data.currentPage > data.totalPages) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currentPage"],
      message: "A página atual não pode ser maior que o total de páginas.",
    });
  }
});
