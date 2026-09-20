"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export async function dismissOnboardingAction(): Promise<{ error: string | null }> {
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
