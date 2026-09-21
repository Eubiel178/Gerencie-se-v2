"use server";

import { revalidatePath } from "next/cache";

import { getEventFetcher } from "@/features/events/data/get-event-fetcher";
import * as domain from "@/features/events/domain";
import type { ActionResult } from "@/types/action-result";
import { validationSchema } from "@/validation/event-schema";

/**
 * Server Actions de Event.
 *
 * `LocalEvent` (via `getEventFetcher`) usa Drizzle + o driver `postgres`,
 * que só existem no servidor — por isso os Client Components (AddEvent,
 * EditEvent, o Card com o botão de excluir) não chamam mais o repositório
 * diretamente e passam a chamar estas actions, que rodam sempre no servidor
 * e resolvem o usuário dono dos dados a partir da sessão (nunca de um valor
 * vindo do formulário).
 */

export async function createEventAction(
  data: domain.CreateEvent.Params
): Promise<ActionResult> {
  const parsed = validationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getEventFetcher().create({
      ...parsed.data,
      end: parsed.data.end || undefined,
      url: parsed.data.url || undefined,
    });
    revalidatePath("/home/event");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o evento. Tente novamente." };
  }
}

export async function updateEventAction(
  data: domain.UpdateEvent.Params
): Promise<ActionResult> {
  const parsed = validationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getEventFetcher().update({
      ...parsed.data,
      id: data.id,
      end: parsed.data.end || undefined,
      url: parsed.data.url || undefined,
    });
    revalidatePath("/home/event");

    return { error: null };
  } catch {
    return {
      error: "Não foi possível salvar as alterações. Tente novamente.",
    };
  }
}

export async function deleteEventAction(
  params: domain.DeleteEvent.Params
): Promise<ActionResult> {
  try {
    await getEventFetcher().delete(params);
    revalidatePath("/home/event");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o evento. Tente novamente." };
  }
}
