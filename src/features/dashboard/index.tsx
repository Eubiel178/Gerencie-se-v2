import dayjs from "dayjs";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";

import {
  GoalsProgress,
  HabitsToday,
  HydrationMini,
  MascotCard,
  NextAction,
  TasksSummary,
} from "./components";
import { buildNextAction } from "./next-action";

import styles from "./dashboard.module.css";

const PRIORITY_RANK = { critica: 3, alta: 2, media: 1, baixa: 0 } as const;

export async function Dashboard() {
  const [tasks, routine, habits, goals, mascot, hydrationToday] = await Promise.all([
    getTaskFetcher().loadAll(),
    getRoutineFetcher().loadAll(),
    getHabitFetcher().loadAll(),
    getGoalFetcher().loadAll(),
    getMascotFetcher().getMascot(),
    getHydrationFetcher().getToday(),
  ]);

  const nextAction = buildNextAction({ tasks, routine, habits });

  const pendingTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
    .slice(0, 5);

  const activeGoals = [...goals]
    .filter((goal) => !goal.archived)
    .sort((a, b) => a.progressPercent - b.progressPercent)
    .slice(0, 3);

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className={styles.grid}>
      <div className={styles.hero}>
        <h1 className={styles.heading}>Visão geral</h1>
        <NextAction action={nextAction} />
      </div>

      <div className={styles.column}>
        <TasksSummary tasks={pendingTasks} />
        <GoalsProgress goals={activeGoals} />
      </div>

      <div className={styles.column}>
        <HabitsToday habits={habits} today={today} />
        <MascotCard mascot={mascot} />
        <HydrationMini today={hydrationToday} />
      </div>
    </div>
  );
}
