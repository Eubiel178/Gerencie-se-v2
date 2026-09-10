import styles from "./styles.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  "aria-label"?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  "aria-label": ariaLabel = "Carregando",
  className,
}: SpinnerProps) {
  const classNames = [styles.spinner, styles[size], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return <span role="status" aria-label={ariaLabel} className={classNames} />;
}
