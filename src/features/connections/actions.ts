"use server";

import { revalidatePath } from "next/cache";

import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { inviteConnectionSchema } from "@/validation/connection-schema";

import type { ActionResult } from "@/types/action-result";

export async function inviteConnectionAction(data: { email: string }): Promise<ActionResult> {
  const parsed = inviteConnectionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido." };
  }

  try {
    const result = await getConnectionFetcher().invite(parsed.data);
    revalidatePath("/home/settings");

    return { error: result.error };
  } catch {
    return { error: "Não foi possível enviar o convite. Tente novamente." };
  }
}

export async function respondConnectionAction(params: {
  id: string;
  accept: boolean;
}): Promise<ActionResult> {
  try {
    await getConnectionFetcher().respond(params);
    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return { error: "Não foi possível responder ao convite. Tente novamente." };
  }
}

export async function deleteConnectionAction(params: { id: string }): Promise<ActionResult> {
  try {
    await getConnectionFetcher().delete(params);
    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return { error: "Não foi possível remover. Tente novamente." };
  }
}
