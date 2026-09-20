import "server-only";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";

import * as domain from "@/features/assistant/domain";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { getOrCreateUserPreferencesRow } from "@/lib/shared/get-or-create-user-preferences";

// No máximo 5 interrupções auto-abertas por dia — depois disso o
// widget continua existindo (avatar visível), só para de auto-abrir o
// balão sozinho até a data virar. Presença reduzida e o dismiss manual
// continuam funcionando normalmente, independente desse limite.
const MAX_DAILY_INSIGHTS = 5;

/** Mesmo padrão de `LocalHydration.getGoal`: lê a linha de preferências do
 * usuário, criando com os valores padrão do schema na primeira leitura
 * (nunca falha por "usuário sem preferências ainda"). */
export class LocalAssistantPreferences
  implements domain.GetAssistantPreferences, domain.UpdateAssistantPreferences, domain.RegisterInsightShown
{
  async getPreferences(): Promise<domain.IAssistantPreferences> {
    const userId = await requireUserId();
    const row = await getOrCreateUserPreferencesRow(userId);

    return { enabled: row.assistantEnabled, reducedPresence: row.assistantReducedPresence };
  }

  async updatePreferences(params: Partial<domain.IAssistantPreferences>): Promise<void> {
    const userId = await requireUserId();

    const patch: Partial<typeof userPreferences.$inferInsert> = {};
    if (params.enabled !== undefined) patch.assistantEnabled = params.enabled;
    if (params.reducedPresence !== undefined) patch.assistantReducedPresence = params.reducedPresence;

    await db
      .insert(userPreferences)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: patch,
      });
  }

  async registerInsightShown(text: string): Promise<{ allowed: boolean }> {
    const userId = await requireUserId();
    const today = dayjs().format("YYYY-MM-DD");

    const [row] = await db
      .select({
        count: userPreferences.assistantDailyInsightCount,
        date: userPreferences.assistantDailyInsightDate,
        lastText: userPreferences.assistantLastInsightText,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Data diferente (ou usuário sem linha ainda) = contagem zerada hoje.
    const isSameDay = row?.date === today;
    const countToday = isSameDay ? row.count : 0;

    // A mesma mensagem de antes, no mesmo dia, nunca consome cota — só
    // registra de novo pra manter a data atualizada.
    if (isSameDay && row.lastText === text) {
      return { allowed: true };
    }

    if (countToday >= MAX_DAILY_INSIGHTS) {
      return { allowed: false };
    }

    await db
      .insert(userPreferences)
      .values({
        userId,
        assistantDailyInsightCount: 1,
        assistantDailyInsightDate: today,
        assistantLastInsightText: text,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          assistantDailyInsightCount: countToday + 1,
          assistantDailyInsightDate: today,
          assistantLastInsightText: text,
        },
      });

    return { allowed: true };
  }
}
