"use server";

import { revalidatePath } from "next/cache";

import * as domain from "@/features/goals/domain";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";

type ActionResult = { error: string | null };

export async function createGoalAction(
  data: domain.CreateGoal.Params
): Promise<ActionResult> {
  try {
    await getGoalFetcher().create(data);
    revalidatePath("/home/goals");

    return { error: null };
  } catch {
    return { error: "Não foi possível salvar o objetivo. Tente novamente." };
  }
}

export async function updateGoalAction(
  data: domain.UpdateGoal.Params
): Promise<ActionResult> {
  try {
    await getGoalFetcher().update(data);
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
): Promise<ActionResult> {
  try {
    await getGoalFetcher().createStep(data);
    revalidatePath("/home/goals");

    return { error: null };
  } catch {
    return { error: "Não foi possível adicionar a etapa. Tente novamente." };
  }
}

export async function updateGoalStepAction(
  data: domain.UpdateGoalStep.Params
): Promise<ActionResult> {
  try {
    await getGoalFetcher().updateStep(data);
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
