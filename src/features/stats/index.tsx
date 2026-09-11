import dayjs from "dayjs";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getFocusFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";
import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";

import { Card } from "@/features/dashboard/components/shared";

import { FocusWeeksChart } from "./focus-weeks-chart";

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
const FOCUS_FETCH_WEEKS_BACK = 28;

export async function Stats() {
  const [tasks, focusHistory, focusHistoryForChart, habits, goals, hydrationToday, hydrationWeek, running] =
    await Promise.all([
      getTaskFetcher().loadAll(),
      getFocusFetcher().loadHistoryInRange(dayjs().subtract(7, "day").toDate()),
      getFocusFetcher().loadHistoryInRange(dayjs().subtract(FOCUS_FETCH_WEEKS_BACK, "week").toDate()),
      getHabitFetcher().loadAll(),
      getGoalFetcher().loadAll(),
      getHydrationFetcher().getToday(),
      getHydrationFetcher().loadWeek(),
      getRunningFetcher().loadAll(),
    ]);

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
          <FocusWeeksChart sessions={focusHistoryForChart} fetchedWeeksBack={FOCUS_FETCH_WEEKS_BACK} />
        </Card>

        <Card title="Melhor sequência de hábito">
          <p className={styles.bigNumber}>{bestStreak} {bestStreak === 1 ? "dia" : "dias"}</p>
        </Card>

        <Card title="Meta de hidratação batida">
          <p className={styles.bigNumber}>{hydrationDays}/7 dias</p>
        </Card>

        <Card title="Progresso médio das metas ativas">
          <p className={styles.bigNumber}>{avgGoalProgress}%</p>
        </Card>

        <Card title="Corrida (7 dias)">
          <p className={styles.bigNumber}>{weeklyRunning.distanceKm} km</p>
          <p className={styles.hint}>{weeklyRunning.sessionCount} corrida(s)</p>
        </Card>
      </div>
    </section>
  );
}
