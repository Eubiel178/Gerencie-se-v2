import { z } from "zod";

export const validationSchema = z.object({
  name: z
    .string()
    .min(1, "Campo obrigatório")
    .max(24, "O nome deve ter no máximo 24 caracteres"),
  personality: z.enum(["afetuoso", "sarcastico", "engracado", "motivador", "zen"]),
  species: z.enum([
    "gato",
    "cachorro",
    "passaro",
    "urso",
    "raposa",
    "panda",
    "golden",
    "akita",
    "dogue-alemao",
    "gato-preto",
    "gato-angora",
    "gato-tabby",
    "gato-laranja",
    "gato-lilas",
    "gato-siames",
  ]),
});
