"use server";

import { revalidatePath } from "next/cache";

import { getCycleFetcher } from "@/features/menstrual-cycle/data/get-cycle-fetcher";
import * as domain from "@/features/menstrual-cycle/domain";
import type { ActionResult } from "@/types/action-result";
import { createCycleEntrySchema } from "@/validation/menstrual-cycle-schema";

export async function createCycleEntryAction(
  data: domain.CreateCycleEntry.Params
): Promise<ActionResult & { id?: string }> {
  const parsed = createCycleEntrySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { id } = await getCycleFetcher().create(parsed.data);
    revalidatePath("/home/menstrual-cycle");
    revalidatePath("/home");

    return { error: null, id };
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
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o registro. Tente novamente." };
  }
}
