import { AddHabit } from "../modal";

import styles from "../../habits.module.css";

export function HabitsHeader() {
  return (
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Seus hábitos</h1>
        <p className={styles.subheading}>Construa consistência, um dia de cada vez.</p>
      </div>

      <AddHabit buttonText="Novo Hábito" />
    </header>
  );
}
