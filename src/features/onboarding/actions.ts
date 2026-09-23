"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";

export async function dismissOnboardingAction(): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, onboardingDismissed: true })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { onboardingDismissed: true },
      });

    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}
