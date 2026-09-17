import { Button } from "..";
import { ButtonRootProps } from "../button-root";
import { ButtonIconProps } from "../button-icon";
import { ButtonTextProps } from "../button-text";

import styles from "./styles.module.css";

export interface ButtonPresetProps {
  root?: ButtonRootProps;
  icon?: ButtonIconProps;
  text?: ButtonTextProps;
}

/** Botão de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): monta Button.Root (sempre variant="ghost")
 * + Button.Icon + Button.Text a partir de três grupos de prop separados
 * — `root` (o que vai pro botão), `icon` (o ícone) e `text` (rótulo
 * opcional) — sem lógica de merge extra aqui dentro. Sem `text`,
 * Button.Text não renderiza nada sozinho. */
export function ButtonPreset({ root, icon, text }: ButtonPresetProps) {
  return (
    <Button.Root
      {...root}
      variant="ghost"
      className={`${styles.iconButton} ${root?.className || ""}`}
    >
      <Button.Icon {...icon} />
      <Button.Text {...text} />
    </Button.Root>
  );
}
