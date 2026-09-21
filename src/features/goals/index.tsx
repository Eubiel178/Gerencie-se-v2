import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";

import { GoalsHeader, GoalsList } from "./components";
import styles from "./styles.module.css";

export async function Goals() {
  const [goalsList, connections] = await Promise.all([
    getGoalFetcher().loadAll(),
    getConnectionFetcher().loadAccepted(),
  ]);

  return (
    <section className={styles.section}>
      <GoalsHeader connections={connections} />
      <GoalsList goalsList={goalsList} connections={connections} />
    </section>
  );
}
