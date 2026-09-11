import dayjs from "dayjs";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getFocusFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";
import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";
import { listAchievements } from "@/features/achievements/get-achievements-status";
import { AchievementsGrid } from "@/features/achievements/components/achievements-grid";

import { Card } from "@/features/dashboard/components/shared";

import { FocusWeeksChart } from "./focus-weeks-chart";
import { HydrationWeeksChart } from "./hydration-weeks-chart";
import { RunningWeeksChart } from "./running-weeks-chart";
import { HabitsWeeksChart } from "./habits-weeks-chart";
import { GoalsWeeksChart } from "./goals-weeks-chart";

import {
  calculateAverageGoalProgress,
  calculateBestHabitStreak,
  calculateHydrationAdherence,
  calculateTaskStats,
  calculateWeeklyFocusHours,
  calculateWeeklyRunningStats,
} from "./calculations";

import styles from "./stats.module.css";

// 28 dias por página de gráfico (4 semanas) × 7 páginas pra trás — dá pra
// navegar até ~6 meses de histórico sem precisar buscar tudo de uma vez.
// Mesmo horizonte pra todo gráfico "por semana" da tela, por consistência.
const WEEKS_BACK = 28;

export async function Stats() {
  const [
    tasks,
    focusHistory,
    focusHistoryForChart,
    habits,
    habitCompletionDates,
    goals,
    hydrationToday,
    hydrationWeek,
    hydrationHistory,
    running,
    runningHistoryForChart,
  ] = await Promise.all([
    getTaskFetcher().loadAll(),
    getFocusFetcher().loadHistoryInRange(dayjs().subtract(7, "day").toDate()),
    getFocusFetcher().loadHistoryInRange(dayjs().subtract(WEEKS_BACK, "week").toDate()),
    getHabitFetcher().loadAll(),
    getHabitFetcher().loadCompletionDatesInRange(dayjs().subtract(WEEKS_BACK, "week").toDate()),
    getGoalFetcher().loadAll(),
    getHydrationFetcher().getToday(),
    getHydrationFetcher().loadWeek(),
    getHydrationFetcher().loadRange(WEEKS_BACK * 7),
    getRunningFetcher().loadAll(),
    getRunningFetcher().loadHistoryInRange(dayjs().subtract(WEEKS_BACK, "week").toDate()),
  ]);

  const achievements = await listAchievements({ tasks, habits, goals });

  const taskStats = calculateTaskStats(tasks);
  const focusHours = calculateWeeklyFocusHours(focusHistory);
  const bestStreak = calculateBestHabitStreak(habits);
  const hydrationDays = calculateHydrationAdherence(hydrationWeek, hydrationToday.goalMl);
  const avgGoalProgress = calculateAverageGoalProgress(goals);
  const weeklyRunning = calculateWeeklyRunningStats(running.sessions);

  return (
    <section className={styles.section}>
      <div>
        <h1 className={styles.heading}>Estatísticas</h1>
        <p className={styles.subheading}>Últimos 7 dias — cada número aqui vem direto do que você registrou.</p>
      </div>

      <div className={styles.grid}>
        <Card title="Tarefas concluídas (7 dias)">
          <p className={styles.bigNumber}>{taskStats.completedThisWeek}</p>
        </Card>

        <Card title="Tarefas atrasadas agora">
          <p className={styles.bigNumber} data-tone={taskStats.overdueCount > 0 ? "warning" : undefined}>
            {taskStats.overdueCount}
          </p>
        </Card>

        <Card title="Taxa de conclusão geral">
          <p className={styles.bigNumber}>{taskStats.completionRate}%</p>
        </Card>

        <Card title="Horas de foco (7 dias)">
          <p className={styles.bigNumber}>{focusHours}h</p>
          <FocusWeeksChart sessions={focusHistoryForChart} fetchedWeeksBack={WEEKS_BACK} />
        </Card>

        <Card title="Melhor sequência de hábito">
          <p className={styles.bigNumber}>{bestStreak} {bestStreak === 1 ? "dia" : "dias"}</p>
          <HabitsWeeksChart completionDates={habitCompletionDates} fetchedWeeksBack={WEEKS_BACK} />
        </Card>

        <Card title="Meta de hidratação batida">
          <p className={styles.bigNumber}>{hydrationDays}/7 dias</p>
          <HydrationWeeksChart
            days={hydrationHistory}
            goalMl={hydrationToday.goalMl}
            fetchedWeeksBack={WEEKS_BACK}
          />
        </Card>

        <Card title="Progresso médio das metas ativas">
          <p className={styles.bigNumber}>{avgGoalProgress}%</p>
          <GoalsWeeksChart goals={goals} />
        </Card>

        <Card title="Corrida (7 dias)">
          <p className={styles.bigNumber}>{weeklyRunning.distanceKm} km</p>
          <p className={styles.hint}>{weeklyRunning.sessionCount} corrida(s)</p>
          <RunningWeeksChart sessions={runningHistoryForChart} fetchedWeeksBack={WEEKS_BACK} />
        </Card>
      </div>

      <Card title="Conquistas">
        <AchievementsGrid achievements={achievements} />
      </Card>
    </section>
  );
}
