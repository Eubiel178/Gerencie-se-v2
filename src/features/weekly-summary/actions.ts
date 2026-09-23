"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result";

import { getWeeklySummaryForCurrentUser } from "./get-weekly-summary";
import { sendWeeklySummaryEmail } from "./send-weekly-summary";


export async function updateWeeklySummaryPreferenceAction(enabled: boolean): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    await db
      .insert(userPreferences)
      .values({ userId, weeklySummaryEnabled: enabled })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { weeklySummaryEnabled: enabled },
      });

    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar a preferência. Tente novamente." };
  }
}

/** Envia o resumo agora, sempre pro e-mail de quem está logado — nunca
 * automático, só quando a pessoa clica em "Enviar um teste agora" em
 * Configurações. É o mecanismo seguro de testar o envio sem precisar
 * esperar o cron/semana passar. */
export async function sendTestWeeklySummaryAction(): Promise<ActionResult> {
  await requireUserId();

  const summary = await getWeeklySummaryForCurrentUser();
  if (!summary) {
    return { error: "Não foi possível montar o resumo (sem e-mail na conta)." };
  }

  return sendWeeklySummaryEmail(summary);
}
