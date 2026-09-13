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

export function Icon({ name, "aria-hidden": ariaHidden, ...props }: IconProps) {
  if (!name) return null;

  const IconComponent = icons[name];

  // Todo uso de `Icon` no projeto é decorativo (par com texto visível) ou
  // fica dentro de um controle que já tem seu próprio `aria-label` (ver
  // `Button.Preset`) — nenhum lugar depende do ícone em si carregar nome
  // acessível. Antes disso, cada chamador precisava lembrar de passar
  // `aria-hidden="true"` manualmente; esquecimentos (encontrados em
  // auditoria) faziam leitores de tela anunciarem um SVG sem nome. Agora
  // é o padrão, e quem realmente precisar do oposto ainda pode passar
  // `aria-hidden={false}` explicitamente.
  return <IconComponent aria-hidden={ariaHidden ?? true} {...props} />;
}
