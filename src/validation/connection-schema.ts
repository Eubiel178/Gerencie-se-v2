import { z } from "zod";

// O `.trim()` aqui não é normalização de negócio (essa fica em
// `normalizeEmail`, `local-connection.ts` — minúsculas etc.) - é só pra não
// rejeitar como "inválido" um e-mail colado com espaço nas pontas ANTES de
// `.email()` rodar: sem isto, `.email()` reprova o valor cru e o usuário
// nunca chega na camada de dados que normalizaria (achado numa revisão de
// código: colar um e-mail de um app de contatos, com espaço, quebrava o
// convite mesmo sendo um e-mail válido).
export const inviteConnectionSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
});
