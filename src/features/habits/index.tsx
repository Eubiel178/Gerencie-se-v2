import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";

import { HabitsHeader, HabitsList } from "./components";

import styles from "./habits.module.css";

export async function Habits() {
  const habitsList = await getHabitFetcher().loadAll();

  return (
    <section className={styles.section}>
      <HabitsHeader />
      <HabitsList habitsList={habitsList} />
    </section>
  );
}
