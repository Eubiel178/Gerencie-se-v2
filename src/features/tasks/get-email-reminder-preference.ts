import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export async function getEmailTaskRemindersEnabled(): Promise<boolean> {
  const userId = await requireUserId();

  const [row] = await db
    .select({ emailTaskReminders: userPreferences.emailTaskReminders })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return row?.emailTaskReminders ?? false;
}
