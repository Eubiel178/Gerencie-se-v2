import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

/** true = ainda não viu (nem pulou) o tour guiado - mesmo raciocínio de
 * `getOnboardingStatus`: sem linha em `user_preference` ainda (usuário
 * nunca escreveu nenhuma preferência) conta como "não visto", nunca
 * como "já visto" - só um `dismiss` explícito desliga de vez. */
export async function shouldShowGuidedTour(): Promise<boolean> {
  const userId = await requireUserId();

  const row = await db
    .select({ guidedTourDismissed: userPreferences.guidedTourDismissed })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return !(row[0]?.guidedTourDismissed ?? false);
}
