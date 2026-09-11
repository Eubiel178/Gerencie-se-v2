import type { IconType } from "react-icons";

import { ButtonRoot, ButtonRootProps } from "../button-root";
import { ButtonIcon } from "../button-icon";

import styles from "../styles.module.css";

type IconButtonPresetProps = Omit<ButtonRootProps, "variant" | "children"> & {
  icon: IconType;
};

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): sempre `variant="ghost"` + tamanho de ícone,
 * o ícone entra pré-tipado por `icon` (ex.: `icon={FaTrash}`, importado
 * de `@/components/icons`) e é renderizado via `Button.Icon`. */
export function IconButtonPreset({ tone, className, icon, ...rest }: IconButtonPresetProps) {
  const classNames = className ? `${styles.iconButton} ${className}` : styles.iconButton;

  return (
    <ButtonRoot variant="ghost" tone={tone} className={classNames} {...rest}>
      <ButtonIcon icon={icon} />
    </ButtonRoot>
  );
}
