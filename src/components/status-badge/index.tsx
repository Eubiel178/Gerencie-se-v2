import styles from "./styles.module.css";

type Tone = "executing" | "paused" | "completed" | "info" | "danger" | "warning";

interface StatusBadgeProps {
  tone: Tone;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  tone,
  children,
  pulse = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={`${styles.badge}${className ? ` ${className}` : ""}`}
      data-tone={tone}
    >
      {pulse && <span className={styles.pulse} aria-hidden="true" />}
      {children}
    </span>
  );
}
