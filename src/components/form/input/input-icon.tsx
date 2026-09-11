import { Icon, IconProps } from "../../icon";

export interface InputIconProps extends IconProps {}

export function InputIcon(props?: InputIconProps) {
  return <Icon {...props} />;
}
