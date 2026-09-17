import { IRunningTotals } from "@/features/running/domain";

import styles from "./styles.module.css";

export function Totals({ totals }: { totals: IRunningTotals }) {
  return (
    <div className={styles.totals}>
      <div className={styles.totalItem}>
        <span className={styles.totalValue}>
          {(totals.totalDistanceMeters / 1000).toFixed(1)} km
        </span>
        <span className={styles.totalLabel}>Distância total</span>
      </div>

      <div className={styles.totalItem}>
        <span className={styles.totalValue}>{Math.round(totals.totalDurationSeconds / 60)} min</span>
        <span className={styles.totalLabel}>Tempo total</span>
      </div>

      <div className={styles.totalItem}>
        <span className={styles.totalValue}>{totals.sessionCount}</span>
        <span className={styles.totalLabel}>Corridas</span>
      </div>
    </div>
  );
}
