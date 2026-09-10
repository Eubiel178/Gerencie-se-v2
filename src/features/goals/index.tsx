import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";

import { GoalsHeader, GoalsList } from "./components";

import styles from "./goals.module.css";

export async function Goals() {
  const goalsList = await getGoalFetcher().loadAll();

  return (
    <section className={styles.section}>
      <GoalsHeader />
      <GoalsList goalsList={goalsList} />
    </section>
  );
}
