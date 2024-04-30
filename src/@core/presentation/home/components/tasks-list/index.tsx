"use client";

import { useFormTags, useParamsUrl } from "@/@core/presentation/hooks";

import { List, Wrapper, Feedback } from "@/components/_ui";
import { Card } from "./card";

import { ITask } from "@/@core/domain";

export function TasksList({ tasksList }: { tasksList: ITask[] }) {
  const paramsUrl = useParamsUrl();
  const formTags = useFormTags();

  const tag = formTags.tagExists(paramsUrl.get("tag") || "");
  const tasksFiltred =
    tag !== "all"
      ? tasksList.filter((task) => task.tag === tag)
      : [...tasksList];
  const thereAreTasks = tasksFiltred.length > 0;

  return (
    <>
      {thereAreTasks ? (
        <List direction="row" wrap="wrap">
          {tasksFiltred.map((task) => (
            <Card
              key={task.id}
              {...task}
              tag={"#" + formTags.tagsLabels[task.tag]}
            />
          ))}
        </List>
      ) : (
        <Wrapper>
          <Feedback>Nenhuma tarefa adicionada</Feedback>
        </Wrapper>
      )}
    </>
  );
}
