"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/hydration/domain";
import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";

type ActionResult = { error: string | null };

export async function logWaterAction(data: domain.LogWater.Params): Promise<ActionResult> {
  try {
    await getHydrationFetcher().logWater(data);
    revalidatePath("/home/hydration");

    return { error: null };
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

    return { error: null };
  } catch {
    return { error: "Não foi possível remover o registro. Tente novamente." };
  }
}

export async function updateHydrationGoalAction(dailyGoalMl: number): Promise<ActionResult> {
  try {
    await getHydrationFetcher().updateGoal(dailyGoalMl);
    revalidatePath("/home/hydration");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar a meta. Tente novamente." };
  }
}
