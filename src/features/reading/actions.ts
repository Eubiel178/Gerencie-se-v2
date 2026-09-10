"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/reading/domain";
import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";
import { createReadingItemSchema, updateReadingItemSchema } from "@/validation/reading-schema";

type ActionResult = { error: string | null };

export async function createReadingItemAction(
  data: domain.CreateReadingItem.Params
): Promise<ActionResult> {
  const parsed = createReadingItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getReadingFetcher().create(parsed.data);
    revalidatePath("/home/reading");

    return { error: null };
  } catch {
    return { error: "Não foi possível adicionar o livro. Tente novamente." };
  }
}

export async function updateReadingItemAction(
  data: domain.UpdateReadingItem.Params
): Promise<ActionResult> {
  const parsed = updateReadingItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getReadingFetcher().update(parsed.data);
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
