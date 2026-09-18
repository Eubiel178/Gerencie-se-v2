"use client";

import { useEffect } from "react";

import { EmptyState } from "@/components";
import { IGoal } from "@/features/goals/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { Card } from "./card";
import { useGoalStore } from "@/features/goals/goal-store";

import styles from "./styles.module.css";

interface GoalsListProps {
  goalsList: IGoal[];
  connections: LoadAcceptedConnections.Model;
}

export function GoalsList({ goalsList, connections }: GoalsListProps) {
  const goals = useGoalStore((state) => state.goals);
  const setGoals = useGoalStore((state) => state.setGoals);

  useEffect(() => {
    setGoals(goalsList);
  }, [goalsList, setGoals]);

  if (goals.length === 0) {
    return (
      <EmptyState variant="box">Você ainda não tem objetivos. Crie o primeiro e divida em etapas pequenas.</EmptyState>
    );
  }

  return (
    <ul className={styles.grid}>
      {goals.map((goal) => (
        <Card key={goal.id} goal={goal} connections={connections} />
      ))}
    </ul>
  );
}
