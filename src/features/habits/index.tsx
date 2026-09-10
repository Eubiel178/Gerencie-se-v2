import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";

import { HabitsHeader, HabitsList } from "./components";

import styles from "./habits.module.css";

export async function Habits() {
  const [habitsList, goalsList, connections] = await Promise.all([
    getHabitFetcher().loadAll(),
    getGoalFetcher().loadAll(),
    getConnectionFetcher().loadAccepted(),
  ]);

  const goalOptions = goalsList.map((goal) => ({ id: goal.id, title: goal.title }));

  return (
    <section className={styles.section}>
      <HabitsHeader connections={connections} goalOptions={goalOptions} />
      <HabitsList habitsList={habitsList} connections={connections} goalOptions={goalOptions} />
    </section>
  );
}
