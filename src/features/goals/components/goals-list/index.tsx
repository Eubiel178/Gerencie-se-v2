import { IGoal } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { Card } from "./card";

import styles from "../../goals.module.css";

interface GoalsListProps {
  goalsList: IGoal[];
  connections: LoadAcceptedConnections.Model;
}

export function GoalsList({ goalsList, connections }: GoalsListProps) {
  if (goalsList.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyState}>
          Você ainda não tem objetivos. Crie o primeiro e divida em etapas pequenas.
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.grid}>
      {goalsList.map((goal) => (
        <Card key={goal.id} goal={goal} connections={connections} />
      ))}
    </ul>
  );
}
