import { z } from "zod";

export const validationSchema = z
  .object({
    tag: z
      .string()
      .refine(
        (value) => ["studie", "work", "exercise", "other"].includes(value),
        {
          message: "Selecione uma tag",
        }
      ),
    title: z
      .string()
      .min(1, "Campo obrigatório")
      .max(30, "O título deve ter no máximo 30 caracteres"),
    description: z
      .string()
      .max(165, "A descricão deve ter no máximo 165 caracteres"),
    priority: z.enum(["baixa", "media", "alta", "critica"]),
    scheduledAt: z.string().optional(),
    // Minutos de antecedência marcados (1 dia antes = 1440, 5 min antes =
    // 5, na hora = 0). Só faz sentido junto de `scheduledAt`, mas não é
    // obrigatório mesmo com data marcada — usuário pode não querer
    // lembrete nenhum. `z.coerce.number()` porque cada checkbox chega como
    // string (atributo `value` do HTML) — ver `ReminderFields`.
    reminderOffsetsMinutes: z.array(z.coerce.number()).optional(),
    recurrence: z.enum(["none", "daily", "weekly"]),
    // "" no formulário = não compartilhada. Convertido para `undefined`
    // antes de chegar na Server Action (ver componente de formulário).
    sharedWithUserId: z.string().optional(),
    // Sincronizar com o Google Agenda é opcional — mas se marcado, o
    // evento no Google precisa de uma data/hora, então passamos a exigir
    // `scheduledAt` só nesse caso (ver `.refine` abaixo).
    syncEnabled: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.syncEnabled) {
        return !!data.scheduledAt;
      }

      return true;
    },
    {
      message: "Informe data e hora para sincronizar com o Google Agenda",
      path: ["scheduledAt"],
    }
  );
