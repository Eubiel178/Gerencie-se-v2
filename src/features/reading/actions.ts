"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/reading/domain";
import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";
import {
  createReadingItemSchema,
  updateReadingCurrentPageSchema,
  updateReadingDetailsSchema,
  updateReadingItemSchema,
} from "@/validation/reading-schema";

import type { ActionResult } from "@/types/action-result";

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

export async function updateReadingCurrentPageAction(
  data: domain.UpdateReadingCurrentPage.Params
): Promise<ActionResult> {
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
    return { error: null };
  } catch {
    return { error: "Não foi possível atualizar a página. Tente novamente." };
  }
}

export async function updateReadingDetailsAction(
  data: domain.UpdateReadingDetails.Params
): Promise<ActionResult> {
  const parsed = updateReadingDetailsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getReadingFetcher().updateDetails(parsed.data);
    revalidatePath("/home/reading");
    return { error: null };
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
