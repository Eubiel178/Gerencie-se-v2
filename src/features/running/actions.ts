"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/running/domain";
import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";

type ActionResult = { error: string | null };

export async function createRunningSessionAction(
  data: domain.CreateRunningSession.Params
): Promise<ActionResult> {
  try {
    await getRunningFetcher().create(data);
    revalidatePath("/home/running");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar a corrida. Tente novamente." };
  }
}

export async function deleteRunningSessionAction(
  params: domain.DeleteRunningSession.Params
): Promise<ActionResult> {
  try {
    await getRunningFetcher().delete(params);
    revalidatePath("/home/running");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir a corrida. Tente novamente." };
  }
}
