import { z } from "zod";

// Única fonte de verdade pro limite de título — reaproveitada pelo schema
// do formulário e pelo schema server-side, pra não arriscar os dois
// divergirem silenciosamente com o tempo.
const TITLE_MAX_LENGTH = 60;
const TITLE_TOO_LONG_MESSAGE = `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres`;
const TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const validationSchema = z.object({
  time: z.string().regex(TIME_FORMAT, "Informe um horário válido (HH:MM)"),
  title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
  // "" no formulário = nenhuma tarefa vinculada. Convertido para
  // `undefined` antes de chegar na Server Action (ver componentes de
  // formulário), que trata ausência como "sem vínculo".
  taskId: z.string().optional(),
  // "" no formulário = não compartilhado.
  sharedWithUserId: z.string().optional(),
});

// Revalidação no servidor da Server Action.
const routineItemParamsShape = {
  time: z.string().regex(TIME_FORMAT, "Horário inválido"),
  title: z.string().min(1, "Campo obrigatório").max(TITLE_MAX_LENGTH, TITLE_TOO_LONG_MESSAGE),
  taskId: z.string().optional().nullable(),
  sharedWithUserId: z.string().optional().nullable(),
};

export const createRoutineItemSchema = z.object(routineItemParamsShape);

export const updateRoutineItemSchema = z.object({
  id: z.string().min(1),
  ...routineItemParamsShape,
});

export const toggleRoutineItemLogSchema = z.object({
  routineItemId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});
