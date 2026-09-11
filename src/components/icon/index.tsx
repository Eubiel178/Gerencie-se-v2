import type { IconType } from "react-icons";

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

export interface IconProps {
  icon: IconType;
  size?: number;
  color?: string;
}

export function Icon({ icon: IconComponent, size, color }: IconProps) {
  return <IconComponent size={size} color={color} />;
}
