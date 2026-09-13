"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/health/domain";
import { getHealthFetcher } from "@/features/health/data/get-health-fetcher";
import { createHealthCheckupSchema } from "@/validation/health-schema";

import type { ActionResult } from "@/types/action-result";

export async function createHealthCheckupAction(
  data: domain.CreateHealthCheckup.Params
): Promise<ActionResult> {
  const parsed = createHealthCheckupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getHealthFetcher().create(parsed.data);
    revalidatePath("/home/health");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function markHealthCheckupDoneAction(
  params: domain.MarkHealthCheckupDone.Params
): Promise<ActionResult> {
  try {
    await getHealthFetcher().markDone(params);
    revalidatePath("/home/health");

    return { error: null };
  } catch {
    return { error: "Não foi possível registrar. Tente novamente." };
  }
}

export async function deleteHealthCheckupAction(
  params: domain.DeleteHealthCheckup.Params
): Promise<ActionResult> {
  try {
    await getHealthFetcher().delete(params);
    revalidatePath("/home/health");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir. Tente novamente." };
  }
}
