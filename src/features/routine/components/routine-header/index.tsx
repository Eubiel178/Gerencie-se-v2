import { AddRoutineItem } from "../modal";
import { TaskOption } from "../modal/interfaces";

import styles from "../../routine.module.css";

interface RoutineHeaderProps {
  taskOptions: TaskOption[];
}

export function RoutineHeader({ taskOptions }: RoutineHeaderProps) {
  return (
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Sua rotina</h1>
        <p className={styles.subheading}>
          Os horários fixos do seu dia, do início ao fim.
        </p>
      </div>

      <AddRoutineItem buttonText="Novo Item" taskOptions={taskOptions} />
    </header>
  );
}
