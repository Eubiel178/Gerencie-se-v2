import { Card } from "@/features/dashboard/components/shared";

import { IHydrationSummary, calculateHydrationGoalPercent } from "@/features/hydration/domain";

import styles from "./styles.module.css";

export function HydrationMini({ today }: { today: IHydrationSummary }) {
  const percent = calculateHydrationGoalPercent(today);

  return (
    <Card title="Hidratação" href="/home/hydration" linkLabel="Registrar">
      <div className={styles.row}>
        <span className={styles.amount}>
          {today.totalMl} <span className={styles.unit}>ml</span>
        </span>
        <span className={styles.goal}>meta: {today.goalMl} ml</span>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </Card>
  );
}
