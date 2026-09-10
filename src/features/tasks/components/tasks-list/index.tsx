"use client";

import { useEffect } from "react";

import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { useParamsUrl } from "@/hooks/use-params-url";

import { List, Wrapper, Feedback } from "@/components";
import { Card } from "./card";

import { ITask } from "@/features/tasks/domain";
import styles from "../../home-dashboard.module.css";
import { useTaskStore } from "@/features/tasks/task-store";

interface TasksListProps {
  tasksList: ITask[];
  isGoogleConnected: boolean;
}

export function TasksList({ tasksList, isGoogleConnected }: TasksListProps) {
  const paramsUrl = useParamsUrl();
  const formTags = useFormTags();
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);

  useEffect(() => {
    setTasks(tasksList);
  }, [setTasks, tasksList]);

  const tag = formTags.tagExists(paramsUrl.get("tag") || "");
  const tasksFiltred =
    tag !== "all"
      ? tasks.filter((task) => task.tag === tag)
      : [...tasks];
  const thereAreTasks = tasksFiltred.length > 0;

  return (
    <>
      {thereAreTasks ? (
        <List className={styles.taskGrid} direction="row" wrap="wrap">
          {tasksFiltred.map((task) => (
            <Card
              key={task.id}
              task={task}
              tagLabel={"#" + formTags.tagsLabels[task.tag]}
              isGoogleConnected={isGoogleConnected}
            />
          ))}
        </List>
      ) : (
        <Wrapper className={styles.empty}>
          <Feedback>Nenhuma tarefa adicionada</Feedback>
        </Wrapper>
      )}
    </>
  );
}
