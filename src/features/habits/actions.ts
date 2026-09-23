"use server";

import { revalidatePath } from "next/cache";

import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import * as domain from "@/features/habits/domain";
import type { ActionResult } from "@/types/action-result";
import {
  createHabitSchema,
  toggleHabitLogSchema,
  updateHabitSchema,
} from "@/validation/habit-schema";

export async function createHabitAction(
  data: domain.CreateHabit.Params
): Promise<ActionResult> {
  const parsed = createHabitSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getHabitFetcher().create(parsed.data);
    revalidatePath("/home/habits");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o hábito. Tente novamente." };
  }
}

export async function updateHabitAction(
  data: domain.UpdateHabit.Params
): Promise<ActionResult> {
  const parsed = updateHabitSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getHabitFetcher().update(parsed.data);
    revalidatePath("/home/habits");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }
}

export async function deleteHabitAction(
  params: domain.DeleteHabit.Params
): Promise<ActionResult> {
  try {
    await getHabitFetcher().delete(params);
    revalidatePath("/home/habits");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o hábito. Tente novamente." };
  }
}

export async function toggleHabitLogAction(
  params: domain.ToggleHabitLog.Params
): Promise<ActionResult & { completed?: boolean }> {
  const parsed = toggleHabitLogSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const result = await getHabitFetcher().toggleLog(parsed.data);
    revalidatePath("/home/habits");
    revalidatePath("/home");

    return { error: null, completed: result.completed };
  } catch {
    return { error: "Não foi possível registrar o hábito agora. Tente novamente." };
  }
}
