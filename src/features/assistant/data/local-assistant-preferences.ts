import "server-only";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";


import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import * as domain from "@/features/assistant/domain";
import { COMPANION_FREQUENCY, isCompanionFrequencyAllowed } from "@/features/execution-companion/domain/companion-frequency";
import { requireUserId } from "@/lib/auth";
import { getOrCreateUserPreferencesRow } from "@/lib/shared/get-or-create-user-preferences";
import { DEFAULT_VOICE_ID, isSupportedVoice } from "@/lib/speech/voices";

// No máximo 5 interrupções auto-abertas por dia — depois disso o
// widget continua existindo (avatar visível), só para de auto-abrir o
// balão sozinho até a data virar. Presença reduzida e o dismiss manual
// continuam funcionando normalmente, independente desse limite. Isto é
// do WIDGET (insights de produtividade), não do Companion de Tarefas -
// ver `hasCompanionBudget`/`registerCompanionMessageShown` abaixo pro
// controle de frequência do Companion (mecanismo diferente).
const MAX_DAILY_INSIGHTS = 5;

interface CompanionSpeechState {
  lastSpokeAt: Date | null;
  abuseGuardTriggered: boolean;
  abuseGuardCountToday: number;
  today: string;
  lastText: string | null;
}

/** Lê o estado real de "quando o Companion falou pela última vez" +
 * status do freio de emergência - fonte única usada tanto pela checagem
 * (`hasCompanionBudget`, só leitura) quanto pelo commit
 * (`registerCompanionMessageShown`), pra nunca divergir entre os dois. */
async function readCompanionSpeechState(userId: string): Promise<CompanionSpeechState> {
  const [row] = await db
    .select({
      lastSpokeAt: userPreferences.assistantCompanionLastSpokeAt,
      abuseGuardCount: userPreferences.assistantCompanionAbuseGuardCount,
      abuseGuardDate: userPreferences.assistantCompanionAbuseGuardDate,
      lastText: userPreferences.assistantCompanionLastText,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const today = dayjs().format("YYYY-MM-DD");
  const isSameDay = row?.abuseGuardDate === today;
  const abuseGuardCountToday = isSameDay ? (row?.abuseGuardCount ?? 0) : 0;

  return {
    lastSpokeAt: row?.lastSpokeAt ?? null,
    abuseGuardTriggered: abuseGuardCountToday >= COMPANION_FREQUENCY.ABUSE_GUARD_DAILY_MAX,
    abuseGuardCountToday,
    today,
    lastText: row?.lastText ?? null,
  };
}

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
      executionIntroShown: row.executionIntroShown,
      // Default literal garante que valores fora do allowlist (banco
      // corrompido / voz removida) nunca estourem a tipagem aqui.
      voiceId: isSupportedVoice(row.assistantVoiceId) ? row.assistantVoiceId : DEFAULT_VOICE_ID,
    };
  }

  async updatePreferences(params: Partial<domain.IAssistantPreferences>): Promise<void> {
    const userId = await requireUserId();

    const patch: Partial<typeof userPreferences.$inferInsert> = {};
    if (params.enabled !== undefined) patch.assistantEnabled = params.enabled;
    if (params.reducedPresence !== undefined) patch.assistantReducedPresence = params.reducedPresence;
    if (params.autoSpeechPromptShown !== undefined) patch.assistantAutoSpeechPromptShown = params.autoSpeechPromptShown;
    if (params.autoSpeechEnabled !== undefined) patch.assistantAutoSpeechEnabled = params.autoSpeechEnabled;
    if (params.executionIntroShown !== undefined) patch.executionIntroShown = params.executionIntroShown;
    if (params.voiceId !== undefined) patch.assistantVoiceId = params.voiceId;

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

  async hasCompanionBudget(check: domain.CompanionFrequencyCheck): Promise<boolean> {
    const userId = await requireUserId();
    const state = await readCompanionSpeechState(userId);
    return isCompanionFrequencyAllowed({
      priority: check.priority,
      frequencyBypass: check.frequencyBypass,
      isEngagedViaChat: check.isEngagedViaChat,
      lastSpokeAt: state.lastSpokeAt,
      now: new Date(),
      abuseGuardTriggered: state.abuseGuardTriggered,
    });
  }

  async registerCompanionMessageShown(
    text: string,
    check: domain.CompanionFrequencyCheck
  ): Promise<{ allowed: boolean }> {
    const userId = await requireUserId();
    const state = await readCompanionSpeechState(userId);

    // Mesmo texto de antes (a mesma condição persistindo entre
    // navegações) nunca conta como uma nova interrupção - nem recheca o
    // intervalo mínimo.
    if (state.lastText === text) {
      return { allowed: true };
    }

    const allowed = isCompanionFrequencyAllowed({
      priority: check.priority,
      frequencyBypass: check.frequencyBypass,
      isEngagedViaChat: check.isEngagedViaChat,
      lastSpokeAt: state.lastSpokeAt,
      now: new Date(),
      abuseGuardTriggered: state.abuseGuardTriggered,
    });

    if (!allowed) {
      return { allowed: false };
    }

    const patch: Partial<typeof userPreferences.$inferInsert> = {
      assistantCompanionLastSpokeAt: new Date(),
      assistantCompanionAbuseGuardCount: state.abuseGuardCountToday + 1,
      assistantCompanionAbuseGuardDate: state.today,
      assistantCompanionLastText: text,
    };

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
