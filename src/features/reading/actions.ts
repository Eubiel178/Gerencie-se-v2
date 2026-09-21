"use server";

import { revalidatePath } from "next/cache";

import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";
import * as domain from "@/features/reading/domain";
import type { ActionResult } from "@/types/action-result";
import {
  createReadingItemSchema,
  updateReadingCurrentPageSchema,
  updateReadingDetailsSchema,
  updateReadingItemSchema,
} from "@/validation/reading-schema";

type ReadingActionResult = ActionResult & { item?: domain.IReadingItem };

export async function createReadingItemAction(
  data: domain.CreateReadingItem.Params
): Promise<ReadingActionResult> {
  const parsed = createReadingItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const item = await getReadingFetcher().create(parsed.data);
    revalidatePath("/home/reading");

    return { error: null, item };
  } catch {
    return { error: "Não foi possível adicionar o livro. Tente novamente." };
  }
}

export async function updateReadingItemAction(
  data: domain.UpdateReadingItem.Params
): Promise<ReadingActionResult> {
  const parsed = updateReadingItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const item = await getReadingFetcher().update(parsed.data);
    if (!item) return { error: "Este item não está mais disponível." };
    revalidatePath("/home/reading");

    return { error: null, item };
  } catch {
    return { error: "Não foi possível atualizar. Tente novamente." };
  }
}

export async function updateReadingCurrentPageAction(
  data: domain.UpdateReadingCurrentPage.Params
): Promise<ReadingActionResult> {
  const parsed = updateReadingCurrentPageSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const result = await getReadingFetcher().updateCurrentPage(parsed.data);
    const errors = {
      "not-found": "Este item não está mais disponível.",
      "total-pages-required": "Informe o total de páginas antes de atualizar a página atual.",
      "page-exceeds-total": "A página atual não pode ser maior que o total de páginas.",
    } as const;

    if (result.status !== "updated") return { error: errors[result.status] };

    revalidatePath("/home/reading");
    return { error: null, item: result.item };
  } catch {
    return { error: "Não foi possível atualizar a página. Tente novamente." };
  }
}

export async function updateReadingDetailsAction(
  data: domain.UpdateReadingDetails.Params
): Promise<ReadingActionResult> {
  const parsed = updateReadingDetailsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const item = await getReadingFetcher().updateDetails(parsed.data);
    if (!item) return { error: "Este item não está mais disponível." };
    revalidatePath("/home/reading");
    return { error: null, item };
  } catch {
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
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
