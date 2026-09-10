import { z } from "zod";

export const validationSchema = z.object({
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Informe um horário válido (HH:MM)"),
  title: z
    .string()
    .min(1, "Campo obrigatório")
    .max(60, "O título deve ter no máximo 60 caracteres"),
  // "" no formulário = nenhuma tarefa vinculada. Convertido para
  // `undefined` antes de chegar na Server Action (ver componentes de
  // formulário), que trata ausência como "sem vínculo".
  taskId: z.string().optional(),
});
