"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/require-user-id";
import {
  disconnectGoogleCalendar,
  updateSelectedCalendar,
} from "@/lib/google-calendar";

import type { ActionResult } from "@/types/action-result";

export async function disconnectGoogleCalendarAction(): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await disconnectGoogleCalendar(userId);
    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return {
      error: "Não foi possível desconectar o Google Agenda. Tente novamente.",
    };
  }
}

export async function updateSelectedCalendarAction(
  calendarId: string
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await updateSelectedCalendar(userId, calendarId);
    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return {
      error: "Não foi possível salvar o calendário selecionado.",
    };
  }
}
