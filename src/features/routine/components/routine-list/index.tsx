import { EmptyState } from "@/components";
import { IRoutineItem } from "@/features/routine/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { TaskOption } from "../modal/interfaces";
import { RoutineListItem } from "./item";

import styles from "../../routine.module.css";

interface RoutineListProps {
  items: IRoutineItem[];
  taskOptions: TaskOption[];
  connections: LoadAcceptedConnections.Model;
}

export function RoutineList({ items, taskOptions, connections }: RoutineListProps) {
  if (items.length === 0) {
    return (
      <EmptyState variant="box">Sua rotina ainda está vazia. Adicione o primeiro horário do seu dia.</EmptyState>
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
          connections={connections}
          linkedTaskTitle={item.taskId ? taskTitleById.get(item.taskId) : undefined}
        />
      ))}
    </ul>
  );
}
