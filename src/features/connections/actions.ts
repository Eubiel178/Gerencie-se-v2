"use server";

import { revalidatePath } from "next/cache";

import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import type { IConnection } from "@/features/connections/domain";
import type { ActionResult } from "@/types/action-result";
import { inviteConnectionSchema } from "@/validation/connection-schema";


export async function inviteConnectionAction(
  data: { email: string }
): Promise<ActionResult & { connection?: IConnection }> {
  const parsed = inviteConnectionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido." };
  }

  try {
    const result = await getConnectionFetcher().invite(parsed.data);
    revalidatePath("/home/settings");

    return { error: result.error, connection: result.connection };
  } catch {
    return { error: "Não foi possível enviar o convite. Tente novamente." };
  }
}

// Declinar/remover uma conexão pode revogar compartilhamento de tarefas,
// objetivos, hábitos e itens de rotina (ver `revokeSharingBetween` em
// `local-connection.ts`) — sem revalidar essas páginas também, quem
// perdeu acesso ainda veria o item compartilhado até navegar manualmente.
function revalidateConnectionDependents() {
  revalidatePath("/home/settings");
  revalidatePath("/home/tasks");
  revalidatePath("/home/goals");
  revalidatePath("/home/habits");
  revalidatePath("/home/routine");
}

export async function respondConnectionAction(params: {
  id: string;
  accept: boolean;
}): Promise<ActionResult> {
  try {
    await getConnectionFetcher().respond(params);
    revalidateConnectionDependents();

    return { error: null };
  } catch {
    return { error: "Não foi possível responder ao convite. Tente novamente." };
  }
}

export async function deleteConnectionAction(params: { id: string }): Promise<ActionResult> {
  try {
    await getConnectionFetcher().delete(params);
    revalidateConnectionDependents();

    return { error: null };
  } catch {
    return { error: "Não foi possível remover. Tente novamente." };
  }
}
