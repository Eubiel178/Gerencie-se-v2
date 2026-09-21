"use server";

import { revalidatePath } from "next/cache";

import { getAssistantPreferencesFetcher } from "@/features/assistant/data/get-assistant-preferences-fetcher";
import { IAssistantPreferences } from "@/features/assistant/domain";
import type { ActionResult } from "@/types/action-result";

export async function updateAssistantPreferencesAction(
  patch: Partial<IAssistantPreferences>
): Promise<ActionResult> {
  try {
    await getAssistantPreferencesFetcher().updatePreferences(patch);

    // O widget aparece no layout de todas as rotas /home/* - revalida a
    // raiz do grupo para refletir a preferência imediatamente em
    // qualquer página aberta.
    revalidatePath("/home", "layout");
    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar a preferência. Tente novamente." };
  }
}
