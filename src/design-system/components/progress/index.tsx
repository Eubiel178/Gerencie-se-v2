import styles from "./progress.module.css";

export interface ProgressProps {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function Progress({ value, label, showValue = false, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={[styles.wrapper, className ?? ""].filter(Boolean).join(" ")}>
      {(label || showValue) && (
        <div className={styles.label}>
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(clamped)}%</span>}
        </div>
      )}

      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={styles.fill} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
