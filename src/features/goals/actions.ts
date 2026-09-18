"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/goals/domain";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import {
  createGoalSchema,
  createGoalStepSchema,
  updateGoalSchema,
  updateGoalStepSchema,
} from "@/validation/goal-schema";

import type { ActionResult } from "@/types/action-result";

export async function createGoalAction(
  data: domain.CreateGoal.Params
): Promise<ActionResult> {
  const parsed = createGoalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await getGoalFetcher().create(parsed.data);
    revalidatePath("/home/goals");

    return { error: null };
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

    return { error: null };
  } catch {
    return { error: "Não foi possível excluir o objetivo. Tente novamente." };
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
    return { error: null };
  } catch {
    return { error: "Não foi possível reordenar as etapas. Tente novamente." };
  }
}
