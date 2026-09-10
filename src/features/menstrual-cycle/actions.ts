"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/menstrual-cycle/domain";
import { getCycleFetcher } from "@/features/menstrual-cycle/data/get-cycle-fetcher";

type ActionResult = { error: string | null };

export async function createCycleEntryAction(
  data: domain.CreateCycleEntry.Params
): Promise<ActionResult> {
  try {
    await getCycleFetcher().create(data);
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
