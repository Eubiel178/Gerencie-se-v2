"use client";

import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";


import { EmptyState } from "@/components";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { ITask } from "@/features/tasks/domain";
import { filterTasks } from "@/features/tasks/filter-tasks";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { sortTasksByPriority } from "@/features/tasks/sort-tasks";
import { useTaskStore } from "@/features/tasks/task-store";

import { useParamsUrl } from "../../hooks/use-params-url";
import styles from "../shared/styles.module.css";

import { Card } from "./card";

interface TasksListProps {
  tasksList: ITask[];
  isGoogleConnected: boolean;
  connections: LoadAcceptedConnections.Model;
}

export function TasksList({ tasksList, isGoogleConnected, connections }: TasksListProps) {
  const paramsUrl = useParamsUrl();
  const formTags = useFormTags();
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const lowEnergyMode = useTaskStore((state) => state.lowEnergyMode);
  const resetFilters = useTaskStore((state) => state.resetFilters);
  const router = useRouter();
  const pathname = usePathname();

  // Ressincroniza sempre que o server manda uma lista nova (revalidação,
  // tarefa compartilhada alterada por outra pessoa etc.) — a versão
  // antiga só copiava `tasksList` pra store UMA vez (guarda `initializedRef`)
  // e ignorava pra sempre qualquer prop nova depois disso. A correção NÃO
  // pode ajustar o estado durante a própria renderização como em
  // `RoutineList`/`HabitsList` (que usam `useState` local) — `setTasks` é
  // do Zustand, uma store EXTERNA compartilhada por outros componentes;
  // chamá-la durante a renderização deste componente pode tentar
  // atualizar outro componente Zustand-subscrito enquanto ele ainda está
  // renderizando (confirmado: quebrava a criação de tarefa com "Cannot
  // update a component while rendering a different component"). Store
  // externa = sincronizar em efeito é o lugar certo; só remover a guarda
  // de "uma vez só" já resolve, sem precisar do truque de renderização.
  useEffect(() => {
    setTasks(tasksList);
  }, [tasksList, setTasks]);

  const tag = formTags.tagExists(paramsUrl.get("tag") || "");
  const tasksByTag = tag !== "all" ? tasks.filter((task) => task.tag === tag) : tasks;
  const tasksFiltred = filterTasks(tasksByTag, { searchQuery, statusFilter, priorityFilter, lowEnergyMode });
  // Prioridade primeiro, e dentro de cada prioridade quem ainda não
  // concluiu vem antes de quem já concluiu — dois `.sort()` estáveis
  // encadeados (o segundo preserva a ordem de prioridade já aplicada
  // dentro de cada grupo concluída/pendente).
  const tasksSorted = sortTasksByPriority(tasksFiltred).sort(
    (a, b) => Number(a.completed) - Number(b.completed)
  );
  const thereAreTasks = tasksSorted.length > 0;
  const isFiltered =
    tag !== "all" ||
    searchQuery.length > 0 ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    lowEnergyMode;

  function clearFilters() {
    resetFilters();
    router.replace(pathname);
  }

  return (
    <>
      {thereAreTasks ? (
        <ul className={styles.taskGrid}>
          {tasksSorted.map((task) => (
            <Card
              key={task.id}
              task={task}
              tagLabel={formTags.tagsLabels[task.tag]}
              isGoogleConnected={isGoogleConnected}
              connections={connections}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          variant="box"
          action={tasksList.length > 0 && isFiltered ? { label: "Limpar filtros", onClick: clearFilters } : undefined}
        >
          {tasksList.length === 0
            ? "Sua lista está livre. Adicione a primeira tarefa que merece atenção."
            : "Nenhuma tarefa aparece com os filtros atuais. Limpe os filtros para ver todas as tarefas."}
        </EmptyState>
      )}
    </>
  );
}
