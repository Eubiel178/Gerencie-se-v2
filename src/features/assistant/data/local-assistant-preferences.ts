import "server-only";

import { eq } from "drizzle-orm";

import * as domain from "@/features/assistant/domain";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

/** Mesmo padrão de `LocalHydration.getGoal`: lê a linha de preferências do
 * usuário, criando com os valores padrão do schema na primeira leitura
 * (nunca falha por "usuário sem preferências ainda"). */
export class LocalAssistantPreferences
  implements domain.GetAssistantPreferences, domain.UpdateAssistantPreferences
{
  async getPreferences(): Promise<domain.IAssistantPreferences> {
    const userId = await requireUserId();

    const [row] = await db
      .select({
        assistantEnabled: userPreferences.assistantEnabled,
        assistantReducedPresence: userPreferences.assistantReducedPresence,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (row) {
      return { enabled: row.assistantEnabled, reducedPresence: row.assistantReducedPresence };
    }

    const [created] = await db
      .insert(userPreferences)
      .values({ userId })
      .returning({
        assistantEnabled: userPreferences.assistantEnabled,
        assistantReducedPresence: userPreferences.assistantReducedPresence,
      });

    return { enabled: created.assistantEnabled, reducedPresence: created.assistantReducedPresence };
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
}
