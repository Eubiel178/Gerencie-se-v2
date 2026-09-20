"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export async function dismissGuidedTourAction(): Promise<{ error: string | null }> {
  try {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, guidedTourDismissed: true })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { guidedTourDismissed: true },
      });

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}

/** "Rever tour guiado" em Configurações - o inverso de `dismissGuidedTourAction`. */
export async function resetGuidedTourAction(): Promise<{ error: string | null }> {
  try {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, guidedTourDismissed: false })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { guidedTourDismissed: false },
      });

    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}
