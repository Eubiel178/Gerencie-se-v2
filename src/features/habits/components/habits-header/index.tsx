import { AddHabit } from "../modal";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import styles from "../../habits.module.css";

interface HabitsHeaderProps {
  connections: LoadAcceptedConnections.Model;
}

export function HabitsHeader({ connections }: HabitsHeaderProps) {
  return (
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Seus hábitos</h1>
        <p className={styles.subheading}>Construa consistência, um dia de cada vez.</p>
      </div>

      <AddHabit buttonText="Novo Hábito" connections={connections} />
    </header>
  );
}
