import { z } from "zod";

export const inviteConnectionSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
});
