import "server-only";

import { and, eq, inArray, max, or } from "drizzle-orm";

import * as domain from "@/features/goals/domain";

import { db } from "@/db/client";
import { goalSteps, goals, users } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { assertAcceptedConnection, resolveSharedWithUserIdOnUpdate } from "@/lib/assert-accepted-connection";

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de Goal e suas
 * etapas (`goal_step`). Segue o mesmo padrão de `LocalTask`/`LocalHabit`.
 * `loadAll()` sempre traz as etapas junto e calcula `progressPercent` na
 * hora — nunca lê um valor pré-calculado (ver comentário do schema).
 *
 * Compartilhamento (ver `sharedWithUserId` no schema): quem o objetivo foi
 * compartilhado pode ver/editar/gerenciar etapas, mas só o DONO pode mudar
 * com quem ele está compartilhado ou excluí-lo. `goal_step.userId` é só
 * metadado de quem criou a etapa — o controle de acesso de
 * `updateStep`/`deleteStep` é sempre pelo objetivo (dono OU colaborador),
 * nunca por esse campo.
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

    if (params.sharedWithUserId) {
      await assertAcceptedConnection(userId, params.sharedWithUserId);
    }

    await db.insert(goals).values({
      id,
      userId,
      title: params.title,
      description: params.description,
      deadline: params.deadline || null,
      priority: params.priority,
      sharedWithUserId: params.sharedWithUserId || null,
    });

    return { id };
  }

  async loadAll(): Promise<domain.LoadAllGoals.Model> {
    const userId = await requireUserId();

    const rows = await db.query.goals.findMany({
      where: and(
        or(eq(goals.userId, userId), eq(goals.sharedWithUserId, userId)),
        eq(goals.archived, false)
      ),
      with: { steps: true },
    });

    const ownerIds = [...new Set(rows.filter((row) => row.userId !== userId).map((row) => row.userId))];

    const owners =
      ownerIds.length === 0
        ? []
        : await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, ownerIds));

    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

    return rows.map((row) => mapRowToGoal(row, userId, ownerById.get(row.userId)));
  }

  async update(params: domain.UpdateGoal.Params) {
    const userId = await requireUserId();

    const [existing] = await db
      .select({ userId: goals.userId, sharedWithUserId: goals.sharedWithUserId })
      .from(goals)
      .where(
        and(eq(goals.id, params.id), or(eq(goals.userId, userId), eq(goals.sharedWithUserId, userId)))
      )
      .limit(1);

    if (!existing) {
      throw new Error("Objetivo não encontrado.");
    }

    // Só o dono pode mudar com quem o objetivo está compartilhado — mesmo
    // raciocínio de `LocalTask.update`.
    const nextSharedWithUserId = await resolveSharedWithUserIdOnUpdate({
      userId,
      isOwner: existing.userId === userId,
      currentSharedWithUserId: existing.sharedWithUserId,
      requestedSharedWithUserId: params.sharedWithUserId,
    });

    await db
      .update(goals)
      .set({
        title: params.title,
        description: params.description,
        deadline: params.deadline || null,
        priority: params.priority,
        sharedWithUserId: nextSharedWithUserId,
      })
      .where(
        and(eq(goals.id, params.id), or(eq(goals.userId, userId), eq(goals.sharedWithUserId, userId)))
      );
  }

  /** Só o DONO pode excluir — compartilhamento dá acesso de ajudar, nunca
   * de apagar o que é do outro. */
  async delete(params: domain.DeleteGoal.Params) {
    const userId = await requireUserId();

    await db
      .delete(goals)
      .where(and(eq(goals.id, params.id), eq(goals.userId, userId)));
  }

  async createStep(params: domain.CreateGoalStep.Params) {
    const userId = await requireUserId();

    // `goalId` vem do cliente — sem essa checagem, qualquer usuário
    // autenticado que soubesse/adivinhasse o UUID de um objetivo alheio
    // conseguiria injetar uma etapa nele. Dono OU colaborador (objetivo
    // compartilhado) podem adicionar etapas — é o caso de uso central do
    // compartilhamento (ajudar a planejar/cumprir).
    const [accessibleGoal] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(
        and(eq(goals.id, params.goalId), or(eq(goals.userId, userId), eq(goals.sharedWithUserId, userId)))
      )
      .limit(1);

    if (!accessibleGoal) {
      throw new Error("Objetivo não encontrado.");
    }

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

    await this.assertStepAccess(params.id, userId);

    await db
      .update(goalSteps)
      .set({ completed: params.completed })
      .where(eq(goalSteps.id, params.id));
  }

  async deleteStep(params: domain.DeleteGoalStep.Params) {
    const userId = await requireUserId();

    await this.assertStepAccess(params.id, userId);

    await db.delete(goalSteps).where(eq(goalSteps.id, params.id));
  }

  /** Etapa não tem dono próprio — o acesso é sempre decidido pelo
   * objetivo (dono OU colaborador), nunca por `goal_step.userId` (que só
   * registra quem criou a etapa). */
  private async assertStepAccess(stepId: string, userId: string): Promise<void> {
    const [row] = await db
      .select({ goalUserId: goals.userId, goalSharedWithUserId: goals.sharedWithUserId })
      .from(goalSteps)
      .innerJoin(goals, eq(goalSteps.goalId, goals.id))
      .where(eq(goalSteps.id, stepId))
      .limit(1);

    if (!row || (row.goalUserId !== userId && row.goalSharedWithUserId !== userId)) {
      throw new Error("Etapa não encontrada.");
    }
  }
}

function mapRowToGoal(
  row: typeof goals.$inferSelect & { steps: (typeof goalSteps.$inferSelect)[] },
  viewerId: string,
  owner?: { name: string | null; email: string | null }
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

  const progressPercent = domain.calculateGoalProgress(steps);

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
    sharedWithUserId: row.sharedWithUserId,
    isSharedWithMe: row.userId !== viewerId,
    ownerLabel: row.userId !== viewerId ? owner?.name || owner?.email || null : null,
  };
}
