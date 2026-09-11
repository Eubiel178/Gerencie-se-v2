import { Icon, IconName } from "../icons";

import styles from "./styles.module.css";

type ButtonIconProps = {
  icon: IconName;
};

export function ButtonIcon({ icon }: ButtonIconProps) {
  return (
    <span className={styles.icon}>
      <Icon name={icon} />
    </span>
  );
}
