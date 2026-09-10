import "server-only";

import { and, eq, max } from "drizzle-orm";

import * as domain from "@/features/goals/domain";

import { db } from "@/db/client";
import { goalSteps, goals } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de Goal e suas
 * etapas (`goal_step`). Segue o mesmo padrão de `LocalTask`/`LocalHabit`.
 * `loadAll()` sempre traz as etapas junto e calcula `progressPercent` na
 * hora — nunca lê um valor pré-calculado (ver comentário do schema).
 */
export class LocalGoal
  implements
    domain.CreateGoal,
    domain.LoadAllGoals,
    domain.UpdateGoal,
    domain.DeleteGoal,
    domain.CreateGoalStep,
    domain.UpdateGoalStep,
    domain.DeleteGoalStep
{
  async create(params: domain.CreateGoal.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(goals).values({
      id,
      userId,
      title: params.title,
      description: params.description,
      deadline: params.deadline || null,
      priority: params.priority,
    });

    return { id };
  }

  async loadAll(): Promise<domain.LoadAllGoals.Model> {
    const userId = await requireUserId();

    const rows = await db.query.goals.findMany({
      where: and(eq(goals.userId, userId), eq(goals.archived, false)),
      with: { steps: true },
    });

    return rows.map(mapRowToGoal);
  }

  async update(params: domain.UpdateGoal.Params) {
    const userId = await requireUserId();

    await db
      .update(goals)
      .set({
        title: params.title,
        description: params.description,
        deadline: params.deadline || null,
        priority: params.priority,
      })
      .where(and(eq(goals.id, params.id), eq(goals.userId, userId)));
  }

  async delete(params: domain.DeleteGoal.Params) {
    const userId = await requireUserId();

    await db
      .delete(goals)
      .where(and(eq(goals.id, params.id), eq(goals.userId, userId)));
  }

  async createStep(params: domain.CreateGoalStep.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    const [{ maxOrder }] = await db
      .select({ maxOrder: max(goalSteps.order) })
      .from(goalSteps)
      .where(eq(goalSteps.goalId, params.goalId));

    await db.insert(goalSteps).values({
      id,
      goalId: params.goalId,
      userId,
      title: params.title,
      order: (maxOrder ?? -1) + 1,
    });

    return { id };
  }

  async updateStep(params: domain.UpdateGoalStep.Params) {
    const userId = await requireUserId();

    await db
      .update(goalSteps)
      .set({ completed: params.completed })
      .where(and(eq(goalSteps.id, params.id), eq(goalSteps.userId, userId)));
  }

  async deleteStep(params: domain.DeleteGoalStep.Params) {
    const userId = await requireUserId();

    await db
      .delete(goalSteps)
      .where(and(eq(goalSteps.id, params.id), eq(goalSteps.userId, userId)));
  }
}

function mapRowToGoal(
  row: typeof goals.$inferSelect & { steps: (typeof goalSteps.$inferSelect)[] }
): domain.IGoal {
  const steps = [...row.steps]
    .sort((a, b) => a.order - b.order)
    .map(
      (step): domain.IGoalStep => ({
        id: step.id,
        goalId: step.goalId,
        title: step.title,
        completed: step.completed,
        order: step.order,
      })
    );

  const progressPercent =
    steps.length === 0
      ? 0
      : Math.round((steps.filter((step) => step.completed).length / steps.length) * 100);

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    deadline: row.deadline,
    priority: row.priority,
    archived: row.archived,
    createdAt: row.createdAt,
    steps,
    progressPercent,
  };
}
