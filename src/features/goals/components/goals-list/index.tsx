"use client";

import { useEffect } from "react";

import { EmptyState } from "@/components";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { IGoal } from "@/features/goals/domain";
import { useGoalStore } from "@/features/goals/goal-store";

import { Card } from "./card";
import styles from "./styles.module.css";

interface GoalsListProps {
  goalsList: IGoal[];
  connections: LoadAcceptedConnections.Model;
}

export function GoalsList({ goalsList, connections }: GoalsListProps) {
  const goals = useGoalStore((state) => state.goals);
  const setGoals = useGoalStore((state) => state.setGoals);

  // Ressincroniza sempre que o server manda uma lista nova — a versão
  // antiga só copiava `goalsList` pra store UMA vez e ignorava pra sempre
  // qualquer prop nova depois disso. `setGoals` é do Zustand (store
  // EXTERNA, compartilhada por outros componentes) — chamá-la durante a
  // própria renderização (como `RoutineList`/`HabitsList` fazem com
  // `useState` local) pode tentar atualizar outro componente
  // Zustand-subscrito enquanto ele ainda renderiza (confirmado: esse
  // exato padrão quebrava a criação de tarefa em `TasksList` com "Cannot
  // update a component while rendering a different component"). Store
  // externa sincroniza em efeito; só remover a guarda de "uma vez só" já
  // resolve, sem precisar do truque de ajustar estado durante a renderização.
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
