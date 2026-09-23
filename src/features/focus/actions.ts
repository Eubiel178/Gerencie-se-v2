"use server";

import { revalidatePath } from "next/cache";

import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import * as domain from "@/features/focus/domain";
import type { ActionResult } from "@/types/action-result";
import { validationSchema as mascotSchema } from "@/validation/mascot-schema";

export async function startFocusSessionAction(
  data: domain.StartFocusSession.Params
): Promise<ActionResult & { session?: domain.StartFocusSession.Result }> {
  try {
    const session = await getFocusFetcher().start(data);

    // `start` pode ter finalizado sozinho uma sessão órfã vencida (ver
    // comentário em `LocalFocusSession.start`) - essa conclusão nunca passa
    // por `completeFocusSessionAction` acima, então o crédito de XP fica
    // por conta daqui (achado numa revisão de código: o XP gravado na
    // sessão nunca chegava a somar no mascote).
    if (session.finalizedExpiredSessionXp && session.finalizedExpiredSessionXp > 0) {
      await getMascotFetcher().addXp(session.finalizedExpiredSessionXp);
    }

    revalidatePath("/home/focus");

    return { error: null, session };
  } catch {
    return { error: "Não foi possível iniciar o foco. Tente novamente." };
  }
}

/**
 * Ao concluir a sessão, soma o XP ganho ao mascote — nessa ordem, e só se
 * a sessão realmente rendeu XP. Orquestração feita aqui (não dentro de
 * `LocalFocusSession`), mesmo padrão usado pra sincronização com o Google
 * Agenda em `features/tasks/actions.ts`: cada repositório continua
 * responsável só pela sua própria entidade.
 */
export async function completeFocusSessionAction(
  params: domain.CompleteFocusSession.Params
): Promise<ActionResult & { xpEarned?: number }> {
  try {
    const result = await getFocusFetcher().complete(params);

    if (result.xpEarned > 0) {
      await getMascotFetcher().addXp(result.xpEarned);
    }

    revalidatePath("/home/focus");

    return { error: null, xpEarned: result.xpEarned };
  } catch {
    return { error: "Não foi possível concluir a sessão. Tente novamente." };
  }
}

export async function extendFocusSessionAction(
  params: domain.ExtendFocusSession.Params
): Promise<ActionResult & { plannedDurationSeconds?: number }> {
  try {
    const result = await getFocusFetcher().extend(params);
    revalidatePath("/home/focus");

    return { error: null, plannedDurationSeconds: result.plannedDurationSeconds };
  } catch {
    return { error: "Não foi possível adicionar tempo à sessão. Tente novamente." };
  }
}

export async function cancelFocusSessionAction(
  params: domain.CancelFocusSession.Params
): Promise<ActionResult> {
  try {
    await getFocusFetcher().cancel(params);
    revalidatePath("/home/focus");

    return { error: null };
  } catch {
    return { error: "Não foi possível cancelar a sessão. Tente novamente." };
  }
}

export async function updateMascotAction(patch: domain.IMascotPatch): Promise<ActionResult> {
  const parsed = mascotSchema.partial().safeParse(patch);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getMascotFetcher().updateMascot(parsed.data);
    revalidatePath("/home/focus");
    revalidatePath("/home");
    revalidatePath("/home/settings");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o mascote. Tente novamente." };
  }
}
