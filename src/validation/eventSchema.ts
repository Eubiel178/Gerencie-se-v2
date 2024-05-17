import { dateIsValid } from "@/utils";
import { z } from "zod";

export const validationSchema = z
  .object({
    title: z.string().min(1, "Campo obrigatório"),
    description: z.string().min(1, "Campo obrigatório"),
    start: z
      .string()
      .min(1, "Campo obrigatório")
      .refine((value) => dateIsValid(value), {
        message: "Data inválida",
      }),
    end: z
      .string()
      .refine((value) => dateIsValid(value), {
        message: "Data inválida",
      })
      .or(z.literal("")),
    url: z.string().url("Data inválida").or(z.literal("")),
    backgroundColor: z.string(),
  })
  .refine(
    ({ start, end }) => {
      if (end && new Date(start).getTime() > new Date(end).getTime()) {
        return false;
      }

      return true;
    },
    {
      message: "A data final deve ser maior que a inicial",
      path: ["end"],
    }
  );
