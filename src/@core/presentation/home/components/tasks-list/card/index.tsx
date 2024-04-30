import Link from "next/link";

import { tv } from "tailwind-variants";

import { FaTrash } from "react-icons/fa";

import { useTask } from "@/@core/presentation/hooks/use-task";

import { Button, Paragraph, Wrapper } from "@/components/_ui";
import { EditTask } from "../../modal";

import { ITask } from "@/@core/domain";

const styles = tv({
  base: "bg-white flex flex-col w-full max-w-xs h-96 shadow",
});

export function Card(task: ITask) {
  const { fetcher } = useTask();

  function handleTaskRemove() {
    fetcher.delete({ id: task.id });
  }

  return (
    <li key={task.id} className={styles()}>
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
          <h3>{task.title}</h3>

          <Paragraph color="secondary">{task.description}</Paragraph>
        </Wrapper>

        <Link href={"/home/" + task.id}>Acessar</Link>
      </Wrapper>
    </li>
  );
}
