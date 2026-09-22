import "server-only";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";


import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import * as domain from "@/features/assistant/domain";
import { requireUserId } from "@/lib/auth";
import { getOrCreateUserPreferencesRow } from "@/lib/shared/get-or-create-user-preferences";

// No máximo 5 interrupções auto-abertas por dia — depois disso o
// widget continua existindo (avatar visível), só para de auto-abrir o
// balão sozinho até a data virar. Presença reduzida e o dismiss manual
// continuam funcionando normalmente, independente desse limite.
const MAX_DAILY_INSIGHTS = 5;

// Duas cotas do Companion de Tarefas, separadas de `MAX_DAILY_INSIGHTS`
// (Widget) E entre si (ver comentário completo em `src/db/schema.ts`
// sobre `assistantCompanionDailyCount`/`assistantCompanionMeaningfulCount`).
// "Casual" continua pequeno de propósito (saudação/sessão longa/
// ociosidade não podem virar barulho); "meaningful" é bem mais generoso
// porque começar/concluir tarefa e avisos de prazo são raros por
// natureza e nunca deveriam ser bloqueados por causa de conversa casual.
const MAX_DAILY_CASUAL_MESSAGES = 4;
const MAX_DAILY_MEANINGFUL_MESSAGES = 12;

/** Mesmo padrão de `LocalHydration.getGoal`: lê a linha de preferências do
 * usuário, criando com os valores padrão do schema na primeira leitura
 * (nunca falha por "usuário sem preferências ainda"). */
export class LocalAssistantPreferences
  implements
    domain.GetAssistantPreferences,
    domain.UpdateAssistantPreferences,
    domain.RegisterInsightShown,
    domain.CheckCompanionBudget,
    domain.RegisterCompanionMessageShown,
    domain.CompanionBoundary
{
  async getPreferences(): Promise<domain.IAssistantPreferences> {
    const userId = await requireUserId();
    const row = await getOrCreateUserPreferencesRow(userId);

    return {
      enabled: row.assistantEnabled,
      reducedPresence: row.assistantReducedPresence,
      autoSpeechEnabled: row.assistantAutoSpeechEnabled,
      autoSpeechPromptShown: row.assistantAutoSpeechPromptShown,
    };
  }

  async updatePreferences(params: Partial<domain.IAssistantPreferences>): Promise<void> {
    const userId = await requireUserId();

    const patch: Partial<typeof userPreferences.$inferInsert> = {};
    if (params.enabled !== undefined) patch.assistantEnabled = params.enabled;
    if (params.reducedPresence !== undefined) patch.assistantReducedPresence = params.reducedPresence;
    if (params.autoSpeechPromptShown !== undefined) patch.assistantAutoSpeechPromptShown = params.autoSpeechPromptShown;
    if (params.autoSpeechEnabled !== undefined) patch.assistantAutoSpeechEnabled = params.autoSpeechEnabled;

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

  async hasCompanionBudget(priority: domain.CompanionInteractionPriority): Promise<boolean> {
    const userId = await requireUserId();
    const today = dayjs().format("YYYY-MM-DD");
    const isMeaningful = priority === "meaningful";
    const maxDaily = isMeaningful ? MAX_DAILY_MEANINGFUL_MESSAGES : MAX_DAILY_CASUAL_MESSAGES;

    const [row] = await db
      .select({
        count: isMeaningful
          ? userPreferences.assistantCompanionMeaningfulCount
          : userPreferences.assistantCompanionDailyCount,
        date: isMeaningful
          ? userPreferences.assistantCompanionMeaningfulDate
          : userPreferences.assistantCompanionDailyDate,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const isSameDay = row?.date === today;
    const countToday = isSameDay ? row.count : 0;
    return countToday < maxDaily;
  }

  async registerCompanionMessageShown(
    text: string,
    priority: domain.CompanionInteractionPriority
  ): Promise<{ allowed: boolean }> {
    const userId = await requireUserId();
    const today = dayjs().format("YYYY-MM-DD");
    const isMeaningful = priority === "meaningful";
    const maxDaily = isMeaningful ? MAX_DAILY_MEANINGFUL_MESSAGES : MAX_DAILY_CASUAL_MESSAGES;

    const [row] = await db
      .select({
        count: isMeaningful
          ? userPreferences.assistantCompanionMeaningfulCount
          : userPreferences.assistantCompanionDailyCount,
        date: isMeaningful
          ? userPreferences.assistantCompanionMeaningfulDate
          : userPreferences.assistantCompanionDailyDate,
        lastText: userPreferences.assistantCompanionLastText,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const isSameDay = row?.date === today;
    const countToday = isSameDay ? row.count : 0;

    if (isSameDay && row.lastText === text) {
      return { allowed: true };
    }

    if (countToday >= maxDaily) {
      return { allowed: false };
    }

    const patch: Partial<typeof userPreferences.$inferInsert> = isMeaningful
      ? { assistantCompanionMeaningfulCount: countToday + 1, assistantCompanionMeaningfulDate: today }
      : { assistantCompanionDailyCount: countToday + 1, assistantCompanionDailyDate: today };
    patch.assistantCompanionLastText = text;

    await db
      .insert(userPreferences)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: patch,
      });

    return { allowed: true };
  }

  async getCompanionQuietUntil(): Promise<Date | null> {
    const userId = await requireUserId();

    const [row] = await db
      .select({ quietUntil: userPreferences.assistantCompanionQuietUntil })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!row?.quietUntil) return null;
    // Um valor no passado é o mesmo que nenhum limite ativo - quem chama
    // nunca precisa saber disso, só recebe `null` de volta.
    return row.quietUntil.getTime() > Date.now() ? row.quietUntil : null;
  }

  async setCompanionQuietUntil(quietUntil: Date): Promise<void> {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, assistantCompanionQuietUntil: quietUntil })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { assistantCompanionQuietUntil: quietUntil },
      });
  }
}
