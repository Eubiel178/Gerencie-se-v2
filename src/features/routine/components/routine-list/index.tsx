import { Feedback, Wrapper } from "@/components";

import { IRoutineItem } from "@/features/routine/domain";
import { TaskOption } from "../modal/interfaces";
import { RoutineListItem } from "./item";

import styles from "../../routine.module.css";

interface RoutineListProps {
  items: IRoutineItem[];
  taskOptions: TaskOption[];
}

export function RoutineList({ items, taskOptions }: RoutineListProps) {
  if (items.length === 0) {
    return (
      <Wrapper className={styles.empty}>
        <Feedback>
          Sua rotina ainda está vazia. Adicione o primeiro horário do seu dia.
        </Feedback>
      </Wrapper>
    );
  }

  const taskTitleById = new Map(taskOptions.map((task) => [task.id, task.title]));

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <RoutineListItem
          key={item.id}
          item={item}
          taskOptions={taskOptions}
          linkedTaskTitle={item.taskId ? taskTitleById.get(item.taskId) : undefined}
        />
      ))}
    </ul>
  );
}
