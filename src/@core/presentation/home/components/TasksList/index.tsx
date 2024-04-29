"use client";

import { tv } from "tailwind-variants";
import { FaEdit, FaTrash } from "react-icons/fa";

import { useTaskListContext } from "@/providers/TasksListContext";
import { TaskType } from "@/services/task";
import { EditTask } from "../Modal";

import {
  List,
  Button,
  Wrapper,
  Feedback,
  Paragraph,
  TitleThree,
} from "@/components/_ui";

const styles = tv({
  base: "bg-white flex flex-col w-full max-w-xs h-96 shadow",
});

export function TasksList({ tasksList }: { tasksList: TaskType[] }) {
  // const { tag, handleTaskRemove, setTaskBeingEdited, taskBeingEdited } =
  //   useTaskListContext();

  // const thereAreTasks = tasksList.length > 0;
  // const newTaskList =
  //   tag === "all"
  //     ? [...tasksList]
  //     : tasksList.filter((task) => task.tag === tag);
  // const thereTaskBeingEdited = taskBeingEdited?.id && true;
  // const tagLabels: Record<string, string> = {
  //   studie: "#Estudo",
  //   work: "#Trabalho",
  //   exercise: "#Exercício",
  //   other: "#Outros",
  // };

  return (
    <>
      {/* {thereAreTasks ? (
        <>
          {thereTaskBeingEdited && (
            <EditTask
              open={false}
              setOpen={() => {}}
              taskBeingEdited={{} as any}
            />
          )}

          {
            <List>
              {newTaskList.map((data) => (
                <li key={data.id} className={styles()}>
                  <Wrapper align="start" background="dark" className="h-32">
                    <Wrapper
                      flex="flex1"
                      justify="between"
                      align="center"
                      padding="small"
                    >
                      <Paragraph color="highlight" size="small">
                        {tagLabels[data.tag]}
                      </Paragraph>

                      <Wrapper gap="medium">
                        <Button
                          color="danger"
                          background="transparent"
                          size="xlarge"
                          onClick={() => handleTaskRemove(data.id)}
                        >
                          <FaTrash />
                        </Button>

                        <Button
                          color="primary"
                          background="transparent"
                          size="xlarge"
                          onClick={() => setTaskBeingEdited(data)}
                        >
                          <FaEdit />
                        </Button>
                      </Wrapper>
                    </Wrapper>
                  </Wrapper>

                  <Wrapper
                    direction="column"
                    justify="between"
                    flex="flex1"
                    padding="medium"
                  >
                    <Wrapper direction="column" gap="medium">
                      <TitleThree>{data.title}</TitleThree>

                      <Paragraph color="secondary">
                        {data.description}
                      </Paragraph>
                    </Wrapper>

                    <a href={`home/${data.id}`}>Acessar</a>
                  </Wrapper>
                </li>
              ))}
            </List>
          }
        </>
      ) : (
        <Wrapper>
          <Feedback>Nenhuma tarefa adicionada</Feedback>
        </Wrapper>
      )} */}
    </>
  );
}
