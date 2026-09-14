import { dateIsValid } from "@/utils";
import { z } from "zod";

// Mesmo limite de goal-schema.ts, só por consistência (nenhum motivo
// pra divergir do tamanho de descrição aceito em outra feature).
const DESCRIPTION_MAX_LENGTH = 280;
const DESCRIPTION_TOO_LONG_MESSAGE = `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres`;

export const validationSchema = z
  .object({
    title: z.string().min(1, "Campo obrigatório"),
    // Campo opcional de verdade (a UI já mostra "Detalhes (opcional)"
    // dentro de "Mais opções") - faltava só isso aqui: tinha um
    // `.min(1)` sobrando que exigia preencher mesmo assim, e como o
    // campo fica dentro de uma seção RECOLHIDA por padrão
    // (`CollapsibleSection`, que desmonta o conteúdo quando fechada, não
    // só esconde), o erro de validação nunca aparecia pra ninguém que
    // não tivesse aberto "Mais opções" — parecia que o formulário
    // simplesmente não enviava (achado relatado).
    description: z.string().max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG_MESSAGE),
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
