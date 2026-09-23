import { z } from "zod";

// Únicas fontes de verdade pro limite de título/descrição — reaproveitadas
// pelo schema do formulário (abaixo) e pelo schema server-side (mais
// abaixo), pra não arriscar os dois divergirem silenciosamente com o
// tempo (ver `createTaskSchema`/`updateTaskSchema`).
// Igualado ao limite de goal/habit/routine (60) - era 30 antes, bem
// mais curto que os outros títulos do app à toa (achado relatado:
// "aumente a quantidade de caractere do título das tarefas").
const TITLE_MAX_LENGTH = 60;
const TITLE_TOO_LONG_MESSAGE = `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres`;
// Igualado ao limite de evento/objetivo (280) - era 165 antes, achado
// relatado como "mt pouco".
const DESCRIPTION_MAX_LENGTH = 280;
const DESCRIPTION_TOO_LONG_MESSAGE = `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres`;
const SYNC_REQUIRES_SCHEDULED_AT_MESSAGE = "Informe data e hora para sincronizar com o Google Agenda";
const TASK_TAGS = ["studie", "work", "exercise", "other"] as const;
const REMINDER_OFFSET_VALUES = [30, 60, 180, 1440, 10080] as const;

export const REMINDER_OPTIONS = [
  { label: "30 minutos antes", value: 30 },
  { label: "1 hora antes", value: 60 },
  { label: "3 horas antes", value: 180 },
  { label: "1 dia antes", value: 1440 },
  { label: "1 semana antes", value: 10080 },
] as const;

function isAllowedReminderOffset(value: number): boolean {
  return REMINDER_OFFSET_VALUES.includes(value as (typeof REMINDER_OFFSET_VALUES)[number]);
}

export const validationSchema = z
  .object({
    // `string`, não o enum literal (ver `taskFieldsShape` abaixo): o
    // formulário inicia com `tag: ""` antes do usuário escolher uma opção,
    // e um union de literais não aceita `""` no tipo — o `.refine` cobre a
    // validação de "é uma tag válida" sem estreitar o tipo do campo.
    tag: z.string().refine((value) => (TASK_TAGS as readonly string[]).includes(value), {
      message: "Selecione um tipo de tarefa",
    }),
    title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
    description: z.string().max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG_MESSAGE),
    priority: z.enum(["baixa", "media", "alta", "critica"]),
    scheduledAt: z.string().optional(),
    // Cada checkbox chega como string do HTML, então o valor é convertido
    // antes de validar contra as antecedências suportadas.
    reminderOffsetsMinutes: z.array(z.coerce.number().refine(isAllowedReminderOffset)).optional(),
    recurrence: z.enum(["none", "daily", "weekly"]),
    // "" no formulário = não compartilhada. Convertido para `undefined`
    // antes de chegar na Server Action (ver componente de formulário).
    sharedWithUserId: z.string().optional(),
    // Sincronizar com o Google Agenda é opcional — mas se marcado, o
    // evento no Google precisa de uma data/hora, então passamos a exigir
    // `scheduledAt` só nesse caso (ver `.refine` abaixo).
    syncEnabled: z.boolean(),
  })
  .refine((data) => !data.syncEnabled || !!data.scheduledAt, {
    message: SYNC_REQUIRES_SCHEDULED_AT_MESSAGE,
    path: ["scheduledAt"],
  })
  .refine((data) => !data.reminderOffsetsMinutes?.length || !!data.scheduledAt, {
    message: "Defina quando concluir a tarefa antes de criar um lembrete.",
    path: ["scheduledAt"],
  });

// Revalidação no servidor da Server Action (ver `src/features/tasks/actions.ts`)
// — a tarefa é o único recurso que ainda não tinha isso: o formulário já
// valida no cliente, mas nada reafirmava as mesmas regras do lado do
// servidor, ao contrário de goals/habits/routine (ver `assertTaskAccess`
// para a checagem de posse, que é separada disso). Mesmas regras da
// `validationSchema` acima, sobre o formato já tipado que chega na action
// (ex.: `reminderOffsetsMinutes` já como number[], não string[] de form).
const taskFieldsShape = {
  tag: z.enum(TASK_TAGS, { message: "Selecione um tipo de tarefa" }),
  title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
  description: z.string().max(DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG_MESSAGE),
  priority: z.enum(["baixa", "media", "alta", "critica"]),
  scheduledAt: z.string().optional().nullable(),
  reminderOffsetsMinutes: z.array(z.number().refine(isAllowedReminderOffset)).optional().nullable(),
  recurrence: z.enum(["none", "daily", "weekly"]),
  sharedWithUserId: z.string().optional().nullable(),
  syncEnabled: z.boolean(),
};

function withScheduledAtDependencies<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  return schema
    .refine((data) => !data.syncEnabled || !!data.scheduledAt, {
      message: SYNC_REQUIRES_SCHEDULED_AT_MESSAGE,
      path: ["scheduledAt"],
    })
    .refine((data) => !data.reminderOffsetsMinutes?.length || !!data.scheduledAt, {
      message: "Defina quando concluir a tarefa antes de criar um lembrete.",
      path: ["scheduledAt"],
    });
}

export const createTaskSchema = withScheduledAtDependencies(z.object(taskFieldsShape));

export const updateTaskSchema = withScheduledAtDependencies(
  z.object({ id: z.string().min(1), ...taskFieldsShape })
);
