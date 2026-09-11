import dayjs from "dayjs";

import { auth } from "@/lib/auth";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";

import {
  GoalsProgress,
  Greeting,
  HabitsToday,
  HydrationMini,
  MascotCard,
  NextAction,
  TasksSummary,
} from "./components";
import { buildNextAction } from "./next-action";
import { greetingForHour } from "./greeting";

import styles from "./dashboard.module.css";

const PRIORITY_RANK = { critica: 3, alta: 2, media: 1, baixa: 0 } as const;

export async function Dashboard() {
  const [session, tasks, routine, habits, goals, mascot, hydrationToday] = await Promise.all([
    auth(),
    getTaskFetcher().loadAll(),
    getRoutineFetcher().loadAll(),
    getHabitFetcher().loadAll(),
    getGoalFetcher().loadAll(),
    getMascotFetcher().getMascot(),
    getHydrationFetcher().getToday(),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  const nextAction = buildNextAction({ tasks, routine, habits });

  const pendingTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
    .slice(0, 5);

  const activeGoals = [...goals]
    .filter((goal) => !goal.archived)
    .sort((a, b) => a.progressPercent - b.progressPercent)
    .slice(0, 3);

  const now = dayjs();
  const today = now.format("YYYY-MM-DD");

  const priorityTaskCount = tasks.filter(
    (task) => !task.completed && (task.priority === "alta" || task.priority === "critica")
  ).length;
  const pendingHabitCount = habits.filter(
    (habit) => !habit.archived && !habit.completedToday
  ).length;

  return (
    <div className={styles.grid}>
      <div className={styles.hero}>
        <Greeting
          text={greetingForHour(now.hour(), firstName)}
          priorityTaskCount={priorityTaskCount}
          pendingHabitCount={pendingHabitCount}
          mainGoal={activeGoals[0] ?? null}
        />

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
