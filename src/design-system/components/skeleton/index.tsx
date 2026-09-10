import { CSSProperties } from "react";

import styles from "./skeleton.module.css";

export interface SkeletonProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  variant?: "text" | "circle" | "rect";
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  variant = "text",
  className,
}: SkeletonProps) {
  const classNames = [styles.skeleton, styles[variant], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classNames}
      style={{ width, height }}
      role="presentation"
      aria-hidden="true"
    />
  );
}
