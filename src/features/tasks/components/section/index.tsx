import { ComponentProps } from "react";
import styles from "../shared/styles.module.css";

type SectionProps = ComponentProps<"section">;

export function Section({ children }: SectionProps) {
  return <section className={styles.section}>{children}</section>;
}
