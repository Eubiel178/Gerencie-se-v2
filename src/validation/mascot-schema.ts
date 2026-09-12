import { z } from "zod";

export const validationSchema = z.object({
  name: z
    .string()
    .min(1, "Campo obrigatório")
    .max(24, "O nome deve ter no máximo 24 caracteres"),
  personality: z.enum(["afetuoso", "sarcastico", "engracado", "motivador", "zen"]),
  species: z.enum(["gato", "cachorro", "coelho", "galinha"]),
  // A combinação espécie+raça é validada à parte (ver `updateMascotAction`)
  // — aqui fica só o formato, pra não perder `.partial()` (usado em
  // atualizações parciais) com um `.refine()` de nível de objeto.
  breed: z.string().min(1, "Campo obrigatório").max(30),
});
