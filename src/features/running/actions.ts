"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/running/domain";
import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";
import { createRunningSessionSchema } from "@/validation/running-schema";

import type { ActionResult } from "@/types/action-result";

export async function createRunningSessionAction(
  data: domain.CreateRunningSession.Params
): Promise<ActionResult> {
  const parsed = createRunningSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getRunningFetcher().create(parsed.data);
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
