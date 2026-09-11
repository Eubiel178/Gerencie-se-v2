import { Icon, IconName, IconProps } from "../icons";

import styles from "./styles.module.css";

type ButtonIconProps = Omit<IconProps, "name"> & {
  icon: IconName;
};

export function ButtonIcon({ icon, className, ...rest }: ButtonIconProps) {
  const classNames = className ? `${styles.icon} ${className}` : styles.icon;

  return <Icon name={icon} className={classNames} {...rest} />;
}
