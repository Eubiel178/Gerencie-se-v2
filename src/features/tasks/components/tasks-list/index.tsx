"use client";

import { useEffect } from "react";

import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { useParamsUrl } from "@/hooks/use-params-url";

import { Card } from "./card";

import { ITask } from "@/features/tasks/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import styles from "../../home-dashboard.module.css";
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

  useEffect(() => {
    setTasks(tasksList);
  }, [setTasks, tasksList]);

  const tag = formTags.tagExists(paramsUrl.get("tag") || "");
  const tasksByTag = tag !== "all" ? tasks.filter((task) => task.tag === tag) : tasks;
  const tasksFiltred = filterTasks(tasksByTag, { searchQuery, statusFilter, priorityFilter });
  // Prioridade primeiro, e dentro de cada prioridade quem ainda não
  // concluiu vem antes de quem já concluiu — dois `.sort()` estáveis
  // encadeados (o segundo preserva a ordem de prioridade já aplicada
  // dentro de cada grupo concluída/pendente).
  const tasksSorted = sortTasksByPriority(tasksFiltred).sort(
    (a, b) => Number(a.completed) - Number(b.completed)
  );
  const thereAreTasks = tasksSorted.length > 0;

  return (
    <>
      {thereAreTasks ? (
        <ul className={styles.taskGrid}>
          {tasksSorted.map((task) => (
            <Card
              key={task.id}
              task={task}
              tagLabel={"#" + formTags.tagsLabels[task.tag]}
              isGoogleConnected={isGoogleConnected}
              connections={connections}
            />
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyMessage}>Nenhuma tarefa adicionada</p>
        </div>
      )}
    </>
  );
}
