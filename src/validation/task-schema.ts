import { z } from "zod";

// Únicas fontes de verdade pro limite de título/descrição — reaproveitadas
// pelo schema do formulário (abaixo) e pelo schema server-side (mais
// abaixo), pra não arriscar os dois divergirem silenciosamente com o
// tempo (ver `createTaskSchema`/`updateTaskSchema`).
const TITLE_MAX_LENGTH = 30;
const TITLE_TOO_LONG_MESSAGE = `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres`;
const DESCRIPTION_MAX_LENGTH = 165;
const DESCRIPTION_TOO_LONG_MESSAGE = `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres`;
const SYNC_REQUIRES_SCHEDULED_AT_MESSAGE = "Informe data e hora para sincronizar com o Google Agenda";
const TASK_TAGS = ["studie", "work", "exercise", "other"] as const;

export const validationSchema = z
  .object({
    // `string`, não o enum literal (ver `taskFieldsShape` abaixo): o
    // formulário inicia com `tag: ""` antes do usuário escolher uma opção,
    // e um union de literais não aceita `""` no tipo — o `.refine` cobre a
    // validação de "é uma tag válida" sem estreitar o tipo do campo.
    tag: z.string().refine((value) => (TASK_TAGS as readonly string[]).includes(value), {
      message: "Selecione uma tag",
    }),
    title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
    description: z.string().max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG_MESSAGE),
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
      message: SYNC_REQUIRES_SCHEDULED_AT_MESSAGE,
      path: ["scheduledAt"],
    }
  );

// Revalidação no servidor da Server Action (ver `src/features/tasks/actions.ts`)
// — a tarefa é o único recurso que ainda não tinha isso: o formulário já
// valida no cliente, mas nada reafirmava as mesmas regras do lado do
// servidor, ao contrário de goals/habits/routine (ver `assertTaskAccess`
// para a checagem de posse, que é separada disso). Mesmas regras da
// `validationSchema` acima, sobre o formato já tipado que chega na action
// (ex.: `reminderOffsetsMinutes` já como number[], não string[] de form).
const taskFieldsShape = {
  tag: z.enum(TASK_TAGS, { message: "Selecione uma tag" }),
  title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
  description: z.string().max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG_MESSAGE),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  scheduledAt: z.string().optional().nullable(),
  reminderOffsetsMinutes: z.array(z.number()).optional().nullable(),
  recurrence: z.enum(["none", "daily", "weekly"]),
  sharedWithUserId: z.string().optional().nullable(),
  syncEnabled: z.boolean(),
};

function withSyncRequiresScheduledAt<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  return schema.refine((data) => (data.syncEnabled ? !!data.scheduledAt : true), {
    message: SYNC_REQUIRES_SCHEDULED_AT_MESSAGE,
    path: ["scheduledAt"],
  });
}

export const createTaskSchema = withSyncRequiresScheduledAt(z.object(taskFieldsShape));

export const updateTaskSchema = withSyncRequiresScheduledAt(
  z.object({ id: z.string().min(1), ...taskFieldsShape })
);
