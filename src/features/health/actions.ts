"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/health/domain";
import { getHealthFetcher } from "@/features/health/data/get-health-fetcher";

type ActionResult = { error: string | null };

export async function createHealthCheckupAction(
  data: domain.CreateHealthCheckup.Params
): Promise<ActionResult> {
  try {
    await getHealthFetcher().create(data);
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
