import "server-only";

import dayjs from "dayjs";
import { and, eq, gte, inArray, or } from "drizzle-orm";

import * as domain from "@/features/habits/domain";

import { db } from "@/db/client";
import { habitLogs, habits, users } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { assertAcceptedConnection } from "@/lib/assert-accepted-connection";

const STREAK_WINDOW_DAYS = 60;

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de Habit.
 *
 * Segue o mesmo padrão de `LocalTask`/`LocalRoutineItem`. `loadAll()`
 * calcula sequência/porcentagem de conclusão a partir de `habit_log` a
 * cada chamada — nunca lê um valor pré-calculado, exatamente como o
 * comentário do schema pede.
 *
 * Compartilhamento (ver `sharedWithUserId` no schema): quem o hábito foi
 * compartilhado pode ver/editar/concluir, mas só o DONO pode mudar com
 * quem ele está compartilhado ou excluí-lo. Como `habit_log` tem chave
 * primária (habitId, date) — não (habitId, userId, date) — dono e
 * colaborador compartilham a MESMA sequência: quem marcar primeiro no dia
 * "trava" o registro para os dois.
 */
export class LocalHabit
  implements
    domain.CreateHabit,
    domain.LoadAllHabits,
    domain.UpdateHabit,
    domain.DeleteHabit,
    domain.ToggleHabitLog,
    domain.LoadHabitCompletionsInRange
{
  async create(params: domain.CreateHabit.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    if (params.sharedWithUserId) {
      await assertAcceptedConnection(userId, params.sharedWithUserId);
    }

    await db.insert(habits).values({
      id,
      userId,
      title: params.title,
      frequency: params.frequency,
      targetPerWeek: params.targetPerWeek ?? null,
      goalId: params.goalId ?? null,
      sharedWithUserId: params.sharedWithUserId || null,
    });

    return { id };
  }

  async loadAll(): Promise<domain.LoadAllHabits.Model> {
    const userId = await requireUserId();

    const habitRows = await db
      .select()
      .from(habits)
      .where(
        and(
          or(eq(habits.userId, userId), eq(habits.sharedWithUserId, userId)),
          eq(habits.archived, false)
        )
      );

    const ownerIds = [
      ...new Set(habitRows.filter((row) => row.userId !== userId).map((row) => row.userId)),
    ];

    const owners =
      ownerIds.length === 0
        ? []
        : await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, ownerIds));

    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

    const habitIds = habitRows.map((row) => row.id);
    const windowStart = dayjs()
      .subtract(STREAK_WINDOW_DAYS, "day")
      .format("YYYY-MM-DD");

    // Não filtra por `userId`: um hábito compartilhado tem uma sequência
    // ÚNICA, então o log conta independente de quem marcou.
    const logRows =
      habitIds.length === 0
        ? []
        : await db
            .select({ habitId: habitLogs.habitId, date: habitLogs.date })
            .from(habitLogs)
            .where(and(inArray(habitLogs.habitId, habitIds), gte(habitLogs.date, windowStart)));

    const datesByHabit = new Map<string, Set<string>>();

    for (const log of logRows) {
      const dates = datesByHabit.get(log.habitId) ?? new Set<string>();
      dates.add(log.date);
      datesByHabit.set(log.habitId, dates);
    }

    return habitRows.map((row) =>
      mapRowToHabit(row, datesByHabit.get(row.id) ?? new Set<string>(), userId, ownerById.get(row.userId))
    );
  }

  async update(params: domain.UpdateHabit.Params) {
    const userId = await requireUserId();

    const [existing] = await db
      .select({ userId: habits.userId, sharedWithUserId: habits.sharedWithUserId })
      .from(habits)
      .where(
        and(
          eq(habits.id, params.id),
          or(eq(habits.userId, userId), eq(habits.sharedWithUserId, userId))
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error("Hábito não encontrado.");
    }

    // Só o dono pode mudar com quem o hábito está compartilhado — mesmo
    // raciocínio de `LocalTask.update`.
    const isOwner = existing.userId === userId;
    let nextSharedWithUserId = existing.sharedWithUserId;

    if (isOwner && params.sharedWithUserId !== existing.sharedWithUserId) {
      if (params.sharedWithUserId) {
        await assertAcceptedConnection(userId, params.sharedWithUserId);
      }
      nextSharedWithUserId = params.sharedWithUserId || null;
    }

    await db
      .update(habits)
      .set({
        title: params.title,
        frequency: params.frequency,
        targetPerWeek: params.targetPerWeek ?? null,
        goalId: params.goalId ?? null,
        sharedWithUserId: nextSharedWithUserId,
      })
      .where(
        and(
          eq(habits.id, params.id),
          or(eq(habits.userId, userId), eq(habits.sharedWithUserId, userId))
        )
      );
  }

  /** Só o DONO pode excluir — compartilhamento dá acesso de ajudar, nunca
   * de apagar o que é do outro. */
  async delete(params: domain.DeleteHabit.Params) {
    const userId = await requireUserId();

    await db
      .delete(habits)
      .where(and(eq(habits.id, params.id), eq(habits.userId, userId)));
  }

  async toggleLog(params: domain.ToggleHabitLog.Params): Promise<domain.ToggleHabitLog.Result> {
    const userId = await requireUserId();

    const [habit] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(
        and(
          eq(habits.id, params.habitId),
          or(eq(habits.userId, userId), eq(habits.sharedWithUserId, userId))
        )
      )
      .limit(1);

    if (!habit) {
      throw new Error("Hábito não encontrado.");
    }

    // Não filtra por `userId`: a chave primária de `habit_log` é
    // (habitId, date), então só existe UM registro por dia — de quem quer
    // que tenha marcado primeiro. Ver comentário da classe.
    const [existing] = await db
      .select({ id: habitLogs.id })
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, params.habitId), eq(habitLogs.date, params.date)))
      .limit(1);

    if (existing) {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
      return { completed: false };
    }

    try {
      await db.insert(habitLogs).values({
        id: crypto.randomUUID(),
        habitId: params.habitId,
        userId,
        date: params.date,
      });

      return { completed: true };
    } catch (error) {
      // Corrida rara (dois cliques quase simultâneos, inclusive entre dono
      // e colaborador): outra requisição já inseriu o mesmo (habitId,
      // date) entre o SELECT acima e este INSERT — a chave primária
      // composta rejeita a duplicata. O hábito já está marcado, então
      // tratamos como sucesso em vez de propagar um erro confuso.
      const isUniqueViolation =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505";

      if (isUniqueViolation) {
        return { completed: true };
      }

      throw error;
    }
  }

  /** Datas de conclusão de qualquer hábito ativo (dono ou compartilhado)
   * dentro do período — só pro gráfico agregado de Estatísticas, não
   * precisa saber qual hábito foi marcado em cada data. */
  async loadCompletionDatesInRange(since: Date): Promise<string[]> {
    const userId = await requireUserId();

    const habitRows = await db
      .select({ id: habits.id })
      .from(habits)
      .where(
        and(
          or(eq(habits.userId, userId), eq(habits.sharedWithUserId, userId)),
          eq(habits.archived, false)
        )
      );

    if (habitRows.length === 0) return [];

    const habitIds = habitRows.map((row) => row.id);
    const sinceDate = dayjs(since).format("YYYY-MM-DD");

    const logRows = await db
      .select({ date: habitLogs.date })
      .from(habitLogs)
      .where(and(inArray(habitLogs.habitId, habitIds), gte(habitLogs.date, sinceDate)));

    return logRows.map((row) => row.date);
  }
}

function mapRowToHabit(
  row: typeof habits.$inferSelect,
  completedDates: Set<string>,
  viewerId: string,
  owner?: { name: string | null; email: string | null }
): domain.IHabit {
  const { completedToday, currentStreak, completionsThisWeek } =
    domain.calculateHabitStats(completedDates);

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    frequency: row.frequency,
    targetPerWeek: row.targetPerWeek,
    goalId: row.goalId,
    archived: row.archived,
    createdAt: row.createdAt,
    completedToday,
    currentStreak,
    completionsThisWeek,
    sharedWithUserId: row.sharedWithUserId,
    isSharedWithMe: row.userId !== viewerId,
    ownerLabel: row.userId !== viewerId ? owner?.name || owner?.email || null : null,
  };
}
