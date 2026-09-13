"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/menstrual-cycle/domain";
import { getCycleFetcher } from "@/features/menstrual-cycle/data/get-cycle-fetcher";
import { createCycleEntrySchema } from "@/validation/menstrual-cycle-schema";

import type { ActionResult } from "@/types/action-result";

export async function createCycleEntryAction(
  data: domain.CreateCycleEntry.Params
): Promise<ActionResult> {
  const parsed = createCycleEntrySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getCycleFetcher().create(parsed.data);
    revalidatePath("/home/menstrual-cycle");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o registro. Tente novamente." };
  }
}

export async function deleteCycleEntryAction(
  params: domain.DeleteCycleEntry.Params
): Promise<ActionResult> {
  try {
    await getCycleFetcher().delete(params);
    revalidatePath("/home/menstrual-cycle");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o registro. Tente novamente." };
  }
}
