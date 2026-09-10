import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";

import { HabitsHeader, HabitsList } from "./components";

import styles from "./habits.module.css";

export async function Habits() {
  const [habitsList, connections] = await Promise.all([
    getHabitFetcher().loadAll(),
    getConnectionFetcher().loadAccepted(),
  ]);

  return (
    <section className={styles.section}>
      <HabitsHeader connections={connections} />
      <HabitsList habitsList={habitsList} connections={connections} />
    </section>
  );
}
