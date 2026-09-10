"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/routine/domain";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { createRoutineItemSchema, updateRoutineItemSchema } from "@/validation/routine-schema";

type ActionResult = { error: string | null };

export async function createRoutineItemAction(
  data: domain.CreateRoutineItem.Params
): Promise<ActionResult> {
  const parsed = createRoutineItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getRoutineFetcher().create(parsed.data);
    revalidatePath("/home/routine");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o item de rotina. Tente novamente." };
  }
}

export async function updateRoutineItemAction(
  data: domain.UpdateRoutineItem.Params
): Promise<ActionResult> {
  const parsed = updateRoutineItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getRoutineFetcher().update(parsed.data);
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
