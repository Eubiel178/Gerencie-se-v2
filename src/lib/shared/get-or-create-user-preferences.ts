import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";

/**
 * Lê a linha de `user_preference` do usuário, criando com os valores
 * padrão do schema na primeira leitura (nunca falha por "usuário sem
 * preferências ainda"). "Buscar, se não achar inserir" tem uma corrida
 * real: mais de uma parte da mesma página (ex. `HomeLayout` e a página
 * em si) pode chamar isso em paralelo pro MESMO usuário - pra uma conta
 * zerada, as duas passam pelo SELECT achando nada antes de qualquer
 * INSERT terminar, e a segunda esbarra na chave primária da primeira
 * (erro real de produção reproduzido: "duplicate key value violates
 * unique constraint" - só na PRIMEIRA visita de uma conta nova, nunca
 * mais depois que a linha existe). `onConflictDoNothing` faz a segunda
 * tentativa não fazer nada em vez de estourar erro; sem `created`
 * (RETURNING vazio quando o conflito é ignorado), busca de novo pra
 * pegar a linha que a OUTRA chamada concorrente já criou.
 *
 * Única fonte de verdade deste padrão - antes duplicado (com essa mesma
 * corrida) em `LocalHydration.getGoal` e `LocalAssistantPreferences.
 * getPreferences`.
 */
export async function getOrCreateUserPreferencesRow(
  userId: string
): Promise<typeof userPreferences.$inferSelect> {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (row) return row;

  const [created] = await db
    .insert(userPreferences)
    .values({ userId })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return existing;
}
