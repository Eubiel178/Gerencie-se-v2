import { tv } from "tailwind-variants";

import { FaTrash } from "react-icons/fa";

import { useTask } from "@/@core/presentation/hooks/use-task";

import { Button, Paragraph, Wrapper, DefaultLink } from "@/components/_ui";
import { EditTask } from "../../modal";

import { ITask } from "@/@core/domain";

const styles = tv({
  slots: {
    container: "bg-white flex flex-col flex-1 max-w-xs h-96 shadow",
    title: "text-base font-medium",
  },
});

export function Card(task: ITask) {
  const tv = styles();

  const { fetcher } = useTask();

  function handleTaskRemove() {
    fetcher.delete({ id: task.id });
  }

  return (
    <li key={task.id} className={tv.container()}>
      <Wrapper align="start" background="dark" className="h-32">
        <Wrapper flex="flex1" justify="between" align="center" padding="small">
          <Paragraph color="highlight" size="small">
            {task.tag}
          </Paragraph>

          <Wrapper gap="medium">
            <Button
              color="danger"
              background="transparent"
              size="xlarge"
              onClick={handleTaskRemove}
            >
              <FaTrash />
            </Button>

            <EditTask taskBeingEdited={task} />
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
          <h3 className={tv.title()}>{task.title}</h3>

          <Paragraph color="secondary" size="small">
            {task.description}
          </Paragraph>
        </Wrapper>

        <DefaultLink href={"/home/" + task.id}>Acessar</DefaultLink>
      </Wrapper>
    </li>
  );
}
