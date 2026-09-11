import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { achievementUnlocks } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";

import { ITask } from "@/features/tasks/domain";
import { IHabit } from "@/features/habits/domain";
import { IGoal } from "@/features/goals/domain";
import { calculateBestHabitStreak } from "@/features/stats/calculations";

import { IconName } from "@/components/icon";

import { ACHIEVEMENTS, AchievementStats, calculateHasFullWeek } from "./definitions";

// Recompensa fixa e pequena — o ponto da conquista é o reconhecimento em
// si, não virar uma segunda fonte de XP maior que completar tarefas de
// verdade.
const XP_REWARD = 20;

export interface AchievementView {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  unlocked: boolean;
  unlockedAt: Date | null;
}

export interface AchievementsStatus {
  achievements: AchievementView[];
  newlyUnlocked: AchievementView[];
}

function buildStats(tasks: ITask[], habits: IHabit[], goals: IGoal[]): AchievementStats {
  const completedTasks = tasks.filter((task) => task.completed);

  return {
    tasksCompletedTotal: completedTasks.length,
    habitsCreatedTotal: habits.length,
    bestHabitStreak: calculateBestHabitStreak(habits),
    goalsCompletedTotal: goals.filter((goal) => goal.progressPercent >= 100).length,
    hasFullWeek: calculateHasFullWeek(
      completedTasks.filter((task) => task.completedAt).map((task) => task.completedAt as Date)
    ),
  };
}

async function loadUnlockedAtById(userId: string): Promise<Map<string, Date>> {
  const existingRows = await db
    .select({ achievementId: achievementUnlocks.achievementId, unlockedAt: achievementUnlocks.unlockedAt })
    .from(achievementUnlocks)
    .where(eq(achievementUnlocks.userId, userId));

  return new Map(existingRows.map((row) => [row.achievementId, row.unlockedAt]));
}

/**
 * Versão só-leitura, sem gravar nada — pro grid de Estatísticas, que só
 * precisa MOSTRAR o estado (inclusive pra quem nunca abriu o Dashboard
 * depois de desbloquear algo). A gravação de novo desbloqueio +
 * recompensa de XP é responsabilidade exclusiva de `getAchievementsStatus`
 * (chamada só pelo Dashboard) — assim nunca corre o risco de duas telas
 * lidas "ao mesmo tempo" premiarem XP em dobro pela mesma conquista.
 */
export async function listAchievements(data: {
  tasks: ITask[];
  habits: IHabit[];
  goals: IGoal[];
}): Promise<AchievementView[]> {
  const userId = await requireUserId();
  const stats = buildStats(data.tasks, data.habits, data.goals);
  const unlockedAtById = await loadUnlockedAtById(userId);

  return ACHIEVEMENTS.map((definition) => {
    const conditionMet = definition.isUnlocked(stats);
    const existingUnlockedAt = unlockedAtById.get(definition.id) ?? null;

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      unlocked: conditionMet,
      unlockedAt: existingUnlockedAt,
    };
  });
}

/**
 * Calcula quais conquistas valem AGORA (a partir do mesmo dado que o
 * Dashboard já buscou — nenhuma consulta nova pra tarefa/hábito/meta), e
 * registra em `achievement_unlock` qualquer uma que passou a valer e
 * ainda não estava lá — isso É o "acabou de desbloquear": no mesmo passo,
 * dá um bônus de XP ao mascote. Chamado uma vez por carregamento do
 * Dashboard (única tela que grava desbloqueios/XP — ver `listAchievements`).
 */
export async function getAchievementsStatus(data: {
  tasks: ITask[];
  habits: IHabit[];
  goals: IGoal[];
}): Promise<AchievementsStatus> {
  const userId = await requireUserId();
  const stats = buildStats(data.tasks, data.habits, data.goals);
  const unlockedAtById = await loadUnlockedAtById(userId);

  const toInsert: string[] = [];
  const now = new Date();

  const achievements: AchievementView[] = ACHIEVEMENTS.map((definition) => {
    const conditionMet = definition.isUnlocked(stats);
    const existingUnlockedAt = unlockedAtById.get(definition.id) ?? null;

    if (conditionMet && !existingUnlockedAt) {
      toInsert.push(definition.id);
    }

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      unlocked: conditionMet,
      unlockedAt: existingUnlockedAt ?? (conditionMet ? now : null),
    };
  });

  if (toInsert.length > 0) {
    await db
      .insert(achievementUnlocks)
      .values(toInsert.map((achievementId) => ({ userId, achievementId, unlockedAt: now })))
      .onConflictDoNothing();

    // Uma recompensa de XP por conquista nova — nunca por uma que já
    // tinha sido desbloqueada antes (evita farm reabrindo o Dashboard).
    await getMascotFetcher().addXp(XP_REWARD * toInsert.length);
  }

  return {
    achievements,
    newlyUnlocked: achievements.filter((achievement) => toInsert.includes(achievement.id)),
  };
}
