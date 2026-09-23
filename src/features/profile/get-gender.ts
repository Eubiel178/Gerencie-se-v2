import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export type Gender = "feminino" | "masculino" | "nao_informado";

/** Só existe pra decidir o que mostrar na navegação (ex.: Ciclo Menstrual
 * some pra quem marcou "masculino"). Não cria a linha de preferências se
 * ela ainda não existir — isso já acontece na primeira vez que qualquer
 * outra preferência é lida/gravada (ver `LocalAssistantPreferences`). */
export async function getGender(): Promise<Gender> {
  const userId = await requireUserId();

  const [row] = await db
    .select({ gender: userPreferences.gender })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return row?.gender ?? "nao_informado";
}
