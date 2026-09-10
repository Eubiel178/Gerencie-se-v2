import { AddRoutineItem } from "../modal";
import { TaskOption } from "../modal/interfaces";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import styles from "../../routine.module.css";

interface RoutineHeaderProps {
  taskOptions: TaskOption[];
  connections: LoadAcceptedConnections.Model;
}

export function RoutineHeader({ taskOptions, connections }: RoutineHeaderProps) {
  return (
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Sua rotina</h1>
        <p className={styles.subheading}>
          Os horários fixos do seu dia, do início ao fim.
        </p>
      </div>

      <AddRoutineItem buttonText="Novo Item" taskOptions={taskOptions} connections={connections} />
    </header>
  );
}
