import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

export async function getWeeklySummaryEnabled(): Promise<boolean> {
  const userId = await requireUserId();

  const [row] = await db
    .select({ weeklySummaryEnabled: userPreferences.weeklySummaryEnabled })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return row?.weeklySummaryEnabled ?? false;
}
