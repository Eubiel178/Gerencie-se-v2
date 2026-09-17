import { AddHabit } from "../modal";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { GoalOption } from "../modal/interfaces";

import styles from "./styles.module.css";

interface HabitsHeaderProps {
  connections: LoadAcceptedConnections.Model;
  goalOptions: GoalOption[];
}

export function HabitsHeader({ connections, goalOptions }: HabitsHeaderProps) {
  return (
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Seus hábitos</h1>
        <p className={styles.subheading}>Construa consistência, um dia de cada vez.</p>
      </div>

      <AddHabit buttonText="Novo Hábito" connections={connections} goalOptions={goalOptions} />
    </header>
  );
}
