import { EmptyState } from "@/components";
import { Card } from "@/features/dashboard/components/shared";

import { IGoal } from "@/features/goals/domain";

import styles from "./goals-progress.module.css";

export function GoalsProgress({ goals }: { goals: IGoal[] }) {
  return (
    <Card title="Progresso das metas" href="/home/goals" linkLabel="Ver todas">
      {goals.length === 0 ? (
        <EmptyState tone="muted">Nenhum objetivo cadastrado ainda.</EmptyState>
      ) : (
        <ul className={styles.list}>
          {goals.map((goal) => (
            <li key={goal.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.title}>{goal.title}</span>
                <span className={styles.percent}>{goal.progressPercent}%</span>
              </div>

              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${goal.progressPercent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
