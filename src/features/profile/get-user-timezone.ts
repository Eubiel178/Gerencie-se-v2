import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

// Usado só como último recurso, quando o navegador do usuário ainda não
// teve chance de informar o fuso de verdade (ver `saveUserTimezoneAction`)
// — o mesmo valor que o código antigo lia do processo Node, preservado
// aqui só pra não quebrar quem já sincronizava localmente antes desta
// coluna existir. Repetido (não importado de `google-calendar.ts`) de
// propósito: aquele arquivo não deve mais calcular fuso nenhum sozinho.
const SERVER_TIMEZONE_FALLBACK = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Fuso IANA do usuário (ver comentário da coluna em `src/db/schema.ts`).
 * Recebe o `userId` explícito (em vez de `requireUserId()`) porque é
 * chamado de dentro da sincronização com o Google Agenda, que já resolveu
 * de quem é a tarefa antes de chegar aqui. */
export async function getUserTimezone(userId: string): Promise<string> {
  const [row] = await db
    .select({ timezone: userPreferences.timezone })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return row?.timezone || SERVER_TIMEZONE_FALLBACK;
}

/** Versão para Server Components do usuário autenticado atual. */
export async function getCurrentUserTimezone(): Promise<string> {
  return getUserTimezone(await requireUserId());
}
