"use server";

import { revalidatePath } from "next/cache";

import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import * as domain from "@/features/goals/domain";
import type { ActionResult } from "@/types/action-result";
import {
  createGoalSchema,
  createGoalStepSchema,
  updateGoalSchema,
  updateGoalStepSchema,
} from "@/validation/goal-schema";

export async function createGoalAction(
  data: domain.CreateGoal.Params
): Promise<ActionResult & { goal?: domain.IGoal }> {
  const parsed = createGoalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { goal } = await getGoalFetcher().create(parsed.data);
    revalidatePath("/home/goals");
    revalidatePath("/home");

    return { error: null, goal };
  } catch {
    return { error: "Não foi possível salvar o objetivo. Tente novamente." };
  }
}

export async function updateGoalAction(
  data: domain.UpdateGoal.Params
): Promise<ActionResult> {
  const parsed = updateGoalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getGoalFetcher().update(parsed.data);
    revalidatePath("/home/goals");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }
}

export async function deleteGoalAction(
  params: domain.DeleteGoal.Params
): Promise<ActionResult> {
  try {
    await getGoalFetcher().delete(params);
    revalidatePath("/home/goals");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o objetivo. Tente novamente." };
  }
}

export async function setGoalCompletionAction(
  params: domain.SetGoalCompletion.Params
): Promise<ActionResult & Partial<domain.SetGoalCompletion.Result>> {
  try {
    const result = await getGoalFetcher().setCompletion(params);
    revalidatePath("/home/goals");
    revalidatePath("/home");
    return { error: null, ...result };
  } catch {
    return { error: "Não foi possível atualizar a conclusão do objetivo. Tente novamente." };
  }
}

export async function createGoalStepAction(
  data: domain.CreateGoalStep.Params
): Promise<ActionResult & { id?: string }> {
  const parsed = createGoalStepSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { id } = await getGoalFetcher().createStep(parsed.data);
    revalidatePath("/home/goals");
    revalidatePath("/home");

    return { error: null, id };
  } catch {
    return { error: "Não foi possível adicionar a etapa. Tente novamente." };
  }
}

export async function updateGoalStepAction(
  data: domain.UpdateGoalStep.Params
): Promise<ActionResult> {
  const parsed = updateGoalStepSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getGoalFetcher().updateStep(parsed.data);
    revalidatePath("/home/goals");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível atualizar a etapa. Tente novamente." };
  }
}

export async function deleteGoalStepAction(
  params: domain.DeleteGoalStep.Params
): Promise<ActionResult> {
  try {
    await getGoalFetcher().deleteStep(params);
    revalidatePath("/home/goals");
    revalidatePath("/home");

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir a etapa. Tente novamente." };
  }
}

export async function reorderGoalStepsAction(
  params: domain.ReorderGoalSteps.Params
): Promise<ActionResult> {
  try {
    await getGoalFetcher().reorderSteps(params);
    revalidatePath("/home/goals");
    revalidatePath("/home");
    return { error: null };
  } catch {
    return { error: "Não foi possível reordenar as etapas. Tente novamente." };
  }
}
