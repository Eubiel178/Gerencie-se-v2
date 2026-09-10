import { Card } from "@/features/dashboard/components/shared";

import { IHydrationSummary } from "@/features/hydration/domain";

import styles from "./hydration-mini.module.css";

export function HydrationMini({ today }: { today: IHydrationSummary }) {
  const percent = Math.min(100, Math.round((today.totalMl / today.goalMl) * 100));

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
