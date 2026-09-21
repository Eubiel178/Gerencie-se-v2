"use server";

import { revalidatePath } from "next/cache";

import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import * as domain from "@/features/routine/domain";
import type { ActionResult } from "@/types/action-result";
import {
  createRoutineItemSchema,
  toggleRoutineItemLogSchema,
  updateRoutineItemSchema,
} from "@/validation/routine-schema";

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
    revalidatePath("/home");

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
    revalidatePath("/home");

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
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o item de rotina. Tente novamente." };
  }
}

export async function toggleRoutineItemLogAction(
  params: domain.ToggleRoutineItemLog.Params
): Promise<ActionResult & { completed?: boolean }> {
  const parsed = toggleRoutineItemLogSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const result = await getRoutineFetcher().toggleLog(parsed.data);
    revalidatePath("/home/routine");
    revalidatePath("/home");

    return { error: null, completed: result.completed };
  } catch {
    return { error: "Não foi possível registrar agora. Tente novamente." };
  }
}
