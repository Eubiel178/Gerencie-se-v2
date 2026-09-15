import { EmptyState } from "@/components";
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
      <EmptyState variant="box">Você ainda não tem objetivos. Crie o primeiro e divida em etapas pequenas.</EmptyState>
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
