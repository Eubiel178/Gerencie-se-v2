"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/reading/domain";
import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";

type ActionResult = { error: string | null };

export async function createReadingItemAction(
  data: domain.CreateReadingItem.Params
): Promise<ActionResult> {
  try {
    await getReadingFetcher().create(data);
    revalidatePath("/home/reading");

    return { error: null };
  } catch {
    return { error: "Não foi possível adicionar o livro. Tente novamente." };
  }
}

export async function updateReadingItemAction(
  data: domain.UpdateReadingItem.Params
): Promise<ActionResult> {
  try {
    await getReadingFetcher().update(data);
    revalidatePath("/home/reading");

    return { error: null };
  } catch {
    return { error: "Não foi possível atualizar. Tente novamente." };
  }
}

export async function deleteReadingItemAction(
  params: domain.DeleteReadingItem.Params
): Promise<ActionResult> {
  try {
    await getReadingFetcher().delete(params);
    revalidatePath("/home/reading");

    return { error: null };
  } catch {
    return { error: "Não foi possível remover. Tente novamente." };
  }
}
