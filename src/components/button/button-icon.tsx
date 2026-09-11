import type { IconType } from "react-icons";

import styles from "./styles.module.css";

export type IconElement = React.ReactElement<React.ComponentProps<IconType>>;

export function ButtonIcon({ children }: { children: IconElement }) {
  return <span className={styles.icon}>{children}</span>;
}
