import { Feedback, Wrapper } from "@/components";

import { IGoal } from "@/features/goals/domain";
import { Card } from "./card";

import styles from "../../goals.module.css";

interface GoalsListProps {
  goalsList: IGoal[];
}

export function GoalsList({ goalsList }: GoalsListProps) {
  if (goalsList.length === 0) {
    return (
      <Wrapper className={styles.empty}>
        <Feedback>
          Você ainda não tem objetivos. Crie o primeiro e divida em etapas pequenas.
        </Feedback>
      </Wrapper>
    );
  }

  return (
    <ul className={styles.grid}>
      {goalsList.map((goal) => (
        <Card key={goal.id} goal={goal} />
      ))}
    </ul>
  );
}
