import { ICycleEstimate } from "@/features/menstrual-cycle/domain";

import styles from "./styles.module.css";

export function EstimatePanel({ estimate }: { estimate: ICycleEstimate }) {
  return (
    <div className={styles.estimatePanel}>
      <span className={styles.estimateValue}>
        {estimate.currentCycleDay !== null ? `Dia ${estimate.currentCycleDay}` : "Sem registros ainda"}
      </span>
      <span className={styles.estimateLabel}>do ciclo atual (estimativa)</span>

      {estimate.nextEstimatedStartDate && (
        <>
          <span className={styles.estimateValue}>{formatDate(estimate.nextEstimatedStartDate)}</span>
          <span className={styles.estimateLabel}>
            próximo início estimado
            {estimate.averageCycleLengthDays && ` · ciclo médio de ${estimate.averageCycleLengthDays} dias`}
          </span>
        </>
      )}
    </div>
  );
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
