import { dateIsValid } from "@/utils";
import { z } from "zod";

export const validationSchema = z
  .object({
    title: z.string().min(1, "Campo obrigatório"),
    description: z.string().min(1, "Campo obrigatório"),
    start: z.string().min(1, "Campo obrigatório").refine(dateIsValid, {
      message: "Data inválida",
    }),
    end: z
      .string()
      .optional()
      .refine((value) => (value ? dateIsValid(value) : true), {
        message: "Data inválida",
      }),
    url: z.string().url("Informe uma url válida").optional(),
    backgroundColor: z.string().optional(),
  })
  .refine(
    ({ start, end }) => {
      if (end && new Date(start).getTime() > new Date(end).getTime()) {
        return false;
      }

      return true;
    },
    {
      message: "A data de início deve ser maior que a de início",
      path: ["start"],
    }
  );
