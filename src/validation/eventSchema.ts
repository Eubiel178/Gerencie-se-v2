import { dateIsValid } from "@/utils";
import { z } from "zod";

export const validationSchema = z.object({
  title: z.string().min(1, "Campo obrigatório"),
  description: z.string().min(1, "Campo obrigatório"),
  start: z.string().min(1, "Campo obrigatório").refine(dateIsValid, {
    message: "Data inválida",
  }),
  end: z
    .string()
    .refine((value) => (value ? dateIsValid(value) : true), {
      message: "Data inválida",
    })
    .optional(),
  url: z.string().url("Informe uma url válida").optional(),
  backgroundColor: z.string().optional(),
});
