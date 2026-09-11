import type { IconBaseProps } from "react-icons";

import styles from "./styles.module.css";

export type IconElement = React.ReactElement<IconBaseProps>;

export function ButtonIcon({ children }: { children: IconElement }) {
  return <span className={styles.icon}>{children}</span>;
}
