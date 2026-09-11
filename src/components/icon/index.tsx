import type { IconBaseProps, IconType } from "react-icons";

import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as GoIcons from "react-icons/go";
import * as FiIcons from "react-icons/fi";

const icons = {
  ...FaIcons,
  ...MdIcons,
  ...GoIcons,
  ...FiIcons,
} satisfies Record<string, IconType>;

export type IconName = keyof typeof icons;

export interface IconProps extends IconBaseProps {
  name?: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  if (!name) return null;

  const IconComponent = icons[name];

  return <IconComponent {...props} />;
}
