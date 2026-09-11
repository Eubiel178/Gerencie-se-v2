import { Icon, IconProps } from "../icon";

export interface ButtonIconProps extends IconProps {}

export function ButtonIcon(props?: ButtonIconProps) {
  return <Icon {...props} />;
}
