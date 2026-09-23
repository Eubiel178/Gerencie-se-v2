"use client";

import { useEffect, useState } from "react";

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
  // externa sincroniza em efeito.
  //
  // Mas o efeito só roda DEPOIS do primeiro paint — até lá, a store
  // começa vazia (padrão do Zustand), e nada preenche ela a tempo do
  // primeiro render. Sem esse sinal, esse primeiro render (SSR +
  // hidratação) mostrava "sem objetivos" mesmo com objetivos reais vindos
  // do servidor — regressão real (objetivos existentes "sumindo" da
  // tela). Enquanto o efeito ainda não rodou, usa `goalsList` (a prop)
  // direto; depois, a store volta a ser a fonte de verdade (mutações
  // otimistas).
  //
  // `useState` (nunca uma ref lida durante o render, regra
  // `react-hooks/refs`) setado DENTRO do MESMO efeito que sincroniza a
  // store - no mesmo tick que `setGoals`, nunca um sinal de hidratação
  // genérico e separado (que poderia, em tese, virar `true` antes deste
  // efeito específico rodar, reabrindo a mesma janela de "sem objetivos").
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setGoals(goalsList);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, [goalsList, setGoals]);
  const effectiveGoals = hasHydrated ? goals : goalsList;

  if (effectiveGoals.length === 0) {
    return (
      <EmptyState variant="box">Você ainda não tem objetivos. Crie o primeiro e divida em etapas pequenas.</EmptyState>
    );
  }

  return (
    <ul className={styles.grid}>
      {effectiveGoals.map((goal) => (
        <Card key={goal.id} goal={goal} connections={connections} />
      ))}
    </ul>
  );
}
