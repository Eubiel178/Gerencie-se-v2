import { Button } from "..";
import { ButtonRootProps } from "../button-root";
import { ButtonIconProps } from "../button-icon";

import styles from "../styles.module.css";

export interface ButtonPresetProps {
  root?: ButtonRootProps;
  icon?: ButtonIconProps;
}

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): monta Button.Root (sempre variant="ghost")
 * + Button.Icon a partir de dois grupos de prop separados — `root` (o
 * que vai pro botão) e `icon` (o ícone) — sem lógica de merge extra
 * aqui dentro. */
export function ButtonPreset({ root, icon }: ButtonPresetProps) {
  return (
    <Button.Root
      {...root}
      variant="ghost"
      className={`${styles.iconButton} ${root?.className || ""}`}
    >
      <Button.Icon {...icon} />
    </Button.Root>
  );
}
