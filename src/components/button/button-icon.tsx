import { Icon, IconName } from "../icons";

import styles from "./styles.module.css";

type ButtonIconProps = Omit<React.ComponentProps<typeof Icon>, "name"> & {
  icon: IconName;
};

export function ButtonIcon({ icon, className, ...rest }: ButtonIconProps) {
  const classNames = className ? `${styles.icon} ${className}` : styles.icon;

  return <Icon name={icon} className={classNames} {...rest} />;
}
