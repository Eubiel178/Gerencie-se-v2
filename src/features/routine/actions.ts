"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/routine/domain";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";

type ActionResult = { error: string | null };

export async function createRoutineItemAction(
  data: domain.CreateRoutineItem.Params
): Promise<ActionResult> {
  try {
    await getRoutineFetcher().create(data);
    revalidatePath("/home/routine");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o item de rotina. Tente novamente." };
  }
}

export async function updateRoutineItemAction(
  data: domain.UpdateRoutineItem.Params
): Promise<ActionResult> {
  try {
    await getRoutineFetcher().update(data);
    revalidatePath("/home/routine");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }
}

export async function deleteRoutineItemAction(
  params: domain.DeleteRoutineItem.Params
): Promise<ActionResult> {
  try {
    await getRoutineFetcher().delete(params);
    revalidatePath("/home/routine");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o item de rotina. Tente novamente." };
  }
}
