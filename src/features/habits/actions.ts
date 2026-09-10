"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/habits/domain";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";

type ActionResult = { error: string | null };

export async function createHabitAction(
  data: domain.CreateHabit.Params
): Promise<ActionResult> {
  try {
    await getHabitFetcher().create(data);
    revalidatePath("/home/habits");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o hábito. Tente novamente." };
  }
}

export async function updateHabitAction(
  data: domain.UpdateHabit.Params
): Promise<ActionResult> {
  try {
    await getHabitFetcher().update(data);
    revalidatePath("/home/habits");

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

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o hábito. Tente novamente." };
  }
}

export async function toggleHabitLogAction(
  params: domain.ToggleHabitLog.Params
): Promise<ActionResult & { completed?: boolean }> {
  try {
    const result = await getHabitFetcher().toggleLog(params);
    revalidatePath("/home/habits");

    return { error: null, completed: result.completed };
  } catch {
    return { error: "Não foi possível registrar o hábito agora. Tente novamente." };
  }
}
