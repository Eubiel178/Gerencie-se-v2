import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getConnectionFetcher } from "@/features/connections/data/get-connection-fetcher";

import { GoalsHeader, GoalsList } from "./components";

import styles from "./styles.module.css";

// Reexports pra permitir `import { X } from "@/features/goals"` em vez
// de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getGoalFetcher } from "./data/get-goal-fetcher";

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
