"use server";

import { revalidatePath } from "next/cache";

import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";
import * as domain from "@/features/running/domain";
import type { ActionResult } from "@/types/action-result";
import { createRunningSessionSchema } from "@/validation/running-schema";

export async function createRunningSessionAction(
  data: domain.CreateRunningSession.Params
): Promise<ActionResult & { session?: domain.IRunningSession }> {
  const parsed = createRunningSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const session = await getRunningFetcher().create(parsed.data);
    revalidatePath("/home/running");
    revalidatePath("/home");

    return { error: null, session };
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
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir a corrida. Tente novamente." };
  }
}
