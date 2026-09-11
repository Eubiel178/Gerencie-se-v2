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
      <div className={styles.empty}>
        <p className={styles.emptyMessage}>
          Sua rotina ainda está vazia. Adicione o primeiro horário do seu dia.
        </p>
      </div>
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
