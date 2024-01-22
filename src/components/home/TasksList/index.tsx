import { tv } from "tailwind-variants";

import { TaskType } from "@/services/task";

import {
  DefaultLink,
  Feedback,
  List,
  Paragraph,
  TitleThree,
  Wrapper,
} from "@/components/_ui";

const styles = tv({
  base: "bg-white flex flex-col max-w-xs h-96 shadow",
});

export const TasksList = ({ tasksList }: { tasksList: TaskType[] }) => {
  const thereAreTasks = tasksList.length > 0;
  const tagLabels: Record<string, string> = {
    studie: "#Estudo",
    work: "#Trabalho",
    exercise: "#Exercício",
    other: "#Outros",
  };

  return (
    <>
      {thereAreTasks ? (
        <List>
          {tasksList.map(({ id, tag, title, description }) => (
            <li className={styles()}>
              <Wrapper background="dark" className="h-32" />

              <Wrapper
                direction="column"
                justify="between"
                flex="flex1"
                padding="medium"
              >
                <Wrapper direction="column" gap="medium">
                  <Wrapper direction="column">
                    <Paragraph color="highlight" size="small">
                      {tagLabels[tag]}
                    </Paragraph>

                    <TitleThree>{title}</TitleThree>
                  </Wrapper>

                  <Paragraph color="secondary">{description}</Paragraph>
                </Wrapper>

                <DefaultLink href={`home/${id}`}>Acessar</DefaultLink>
              </Wrapper>
            </li>
          ))}
        </List>
      ) : (
        <Wrapper>
          <Feedback>Nenhuma tarefa adicionada</Feedback>
        </Wrapper>
      )}
    </>
  );
};
