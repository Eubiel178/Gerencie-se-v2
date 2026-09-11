import type { IconType } from "react-icons";

import styles from "./styles.module.css";

type ButtonIconProps = {
  icon: IconType;
};

export function ButtonIcon({ icon }: ButtonIconProps) {
  const Icon = icon;

  return (
    <span className={styles.icon}>
      <Icon />
    </span>
  );
}
