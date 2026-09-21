"use server";

import { revalidatePath } from "next/cache";

import { getHealthFetcher } from "@/features/health/data/get-health-fetcher";
import * as domain from "@/features/health/domain";
import type { ActionResult } from "@/types/action-result";
import { createHealthCheckupSchema, updateHealthCheckupSchema } from "@/validation/health-schema";

export async function createHealthCheckupAction(
  data: domain.CreateHealthCheckup.Params
): Promise<ActionResult & { checkup?: domain.IHealthCheckup }> {
  const parsed = createHealthCheckupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const checkup = await getHealthFetcher().create(parsed.data);
    revalidatePath("/home/health");
    revalidatePath("/home");

    return { error: null, checkup };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}

// A camada de dados (`LocalHealth.update`) já existia — só faltava esta
// Server Action e um jeito de chamá-la pela UI (não havia modal de
// editar, só criar/marcar feito/excluir).
export async function updateHealthCheckupAction(
  data: domain.UpdateHealthCheckup.Params
): Promise<ActionResult> {
  const parsed = updateHealthCheckupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getHealthFetcher().update({ ...parsed.data, id: data.id });
    revalidatePath("/home/health");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }
}

export async function markHealthCheckupDoneAction(
  params: domain.MarkHealthCheckupDone.Params
): Promise<ActionResult & { lastDoneAt?: string }> {
  try {
    const { lastDoneAt } = await getHealthFetcher().markDone(params);
    revalidatePath("/home/health");
    revalidatePath("/home");

    return { error: null, lastDoneAt };
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
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir. Tente novamente." };
  }
}
