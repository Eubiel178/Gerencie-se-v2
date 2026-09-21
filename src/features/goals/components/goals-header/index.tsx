import { LoadAcceptedConnections } from "@/features/connections/domain";

import { AddGoal } from "../modal";

import styles from "./styles.module.css";

interface GoalsHeaderProps {
  connections: LoadAcceptedConnections.Model;
}

export function GoalsHeader({ connections }: GoalsHeaderProps) {
  return (
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Seus objetivos</h1>
        <p className={styles.subheading}>Divida em etapas pequenas e acompanhe o progresso.</p>
      </div>

      <AddGoal buttonText="Novo Objetivo" connections={connections} />
    </header>
  );
}
