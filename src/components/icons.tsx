import type { IconType } from "react-icons";

import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as GoIcons from "react-icons/go";
import * as FiIcons from "react-icons/fi";

/**
 * Ponto único de import de ícones do app.
 *
 * As telas devem importar os ícones daqui, nunca diretamente
 * de react-icons/fa, react-icons/md, etc.
 */

export * from "react-icons/fa";
export * from "react-icons/md";
export * from "react-icons/go";
export * from "react-icons/fi";

const icons = {
  ...FaIcons,
  ...MdIcons,
  ...GoIcons,
  ...FiIcons,
};

export type IconName = keyof typeof icons;

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  const IconComponent = icons[name] as IconType | undefined;

  if (!IconComponent) {
    console.warn(`Ícone "${String(name)}" não encontrado.`);
    return null;
  }

  return <IconComponent size={size} {...props} />;
}
