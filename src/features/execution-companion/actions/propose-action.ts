"use server";

import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { GeminiAssistantProvider } from "@/lib/ai/gemini-provider";
import { validateActionProposal, executeAction, type ActionProposal } from "../services/action-executor";
import { getCompanionAction } from "../domain/actions";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/action-result";

const ProposeActionSchema = z.object({
  message: z.string().min(1, "Mensagem obrigatória"),
  executionSessionId: z.string().optional(),
});

export interface ActionProposalResult extends ActionResult {
  proposal?: ActionProposal;
  confirmed?: boolean;
  result?: unknown;
}

export async function proposeCompanionAction(
  data: { message: string; executionSessionId?: string },
): Promise<ActionProposalResult> {
  const parsed = ProposeActionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await requireUserId();

  // 1. Obter personalidade
  const mascot = await getMascotFetcher().getMascot();
  const personality = mascot?.personality ?? "zen";

  // 2. Gemini interpreta a intenção
  const gemini = new GeminiAssistantProvider();
  const interpreted = await gemini.interpretIntention({
    message: parsed.data.message,
    personality,
  });

  if (!interpreted || !interpreted.action || interpreted.confidence < 0.5) {
    return { error: null };
  }

  // 3. Montar proposal
  const proposal: ActionProposal = {
    action: interpreted.action,
    params: interpreted.params,
    confidence: interpreted.confidence,
    risk: getCompanionAction(interpreted.action)?.risk ?? "low",
    requiresConfirmation: getCompanionAction(interpreted.action)?.requiresConfirmation ?? true,
  };

  return { error: null, proposal };
}

export async function confirmAndExecuteAction(
  data: { action: string; params: Record<string, unknown> },
): Promise<ActionProposalResult> {
  const userId = await requireUserId();

  // 1. Validar proposal
  const validated = await validateActionProposal({
    action: data.action,
    params: data.params,
    confidence: 1,
    risk: "low",
    requiresConfirmation: false,
  });

  if (!validated.valid) {
    return { error: validated.error };
  }

  // 2. Executar
  const result = await executeAction(data.action, validated.validatedParams);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/home");
  revalidatePath("/home/tasks");

  return {
    error: null,
    confirmed: true,
    result: result.result,
  };
}
