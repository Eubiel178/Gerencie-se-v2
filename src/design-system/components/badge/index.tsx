import { HTMLAttributes } from "react";

import styles from "./badge.module.css";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "highlight";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({
  variant = "neutral",
  size = "md",
  className,
  children,
  ...rest
}: BadgeProps) {
  const classNames = [styles.badge, styles[variant], styles[size], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} {...rest}>
      {children}
    </span>
  );
}
