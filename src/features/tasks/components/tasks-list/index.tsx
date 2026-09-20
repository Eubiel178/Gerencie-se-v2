"use client";

import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { useParamsUrl } from "@/hooks/use-params-url";

import { EmptyState } from "@/components";
import { Card } from "./card";

import { ITask } from "@/features/tasks/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import styles from "../shared/styles.module.css";
import { useTaskStore } from "@/features/tasks/task-store";
import { filterTasks } from "@/features/tasks/filter-tasks";
import { sortTasksByPriority } from "@/features/tasks/sort-tasks";

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

  useEffect(() => {
    setTasks(tasksList);
  }, [setTasks, tasksList]);

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
