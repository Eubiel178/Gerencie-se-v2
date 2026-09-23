"use server";

import { revalidatePath } from "next/cache";

import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";
import * as domain from "@/features/hydration/domain";
import type { ActionResult } from "@/types/action-result";
import { logWaterSchema, updateGoalSchema } from "@/validation/hydration-schema";

export async function logWaterAction(data: domain.LogWater.Params): Promise<ActionResult & { id?: string }> {
  const parsed = logWaterSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { id } = await getHydrationFetcher().logWater(parsed.data);
    revalidatePath("/home/hydration");
    revalidatePath("/home");

    return { error: null, id };
  } catch {
    return { error: "Não foi possível registrar. Tente novamente." };
  }
}

export async function deleteHydrationLogAction(
  params: domain.DeleteHydrationLog.Params
): Promise<ActionResult> {
  try {
    await getHydrationFetcher().deleteLog(params);
    revalidatePath("/home/hydration");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível remover o registro. Tente novamente." };
  }
}

export async function updateHydrationGoalAction(dailyGoalMl: number): Promise<ActionResult> {
  const parsed = updateGoalSchema.safeParse(dailyGoalMl);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Meta inválida." };
  }

  try {
    await getHydrationFetcher().updateGoal(parsed.data);
    revalidatePath("/home/hydration");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar a meta. Tente novamente." };
  }
}
