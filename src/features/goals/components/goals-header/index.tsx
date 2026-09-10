import { AddGoal } from "../modal";

import styles from "../../goals.module.css";

export function GoalsHeader() {
  return (
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Seus objetivos</h1>
        <p className={styles.subheading}>Divida em etapas pequenas e acompanhe o progresso.</p>
      </div>

      <AddGoal buttonText="Novo Objetivo" />
    </header>
  );
}
