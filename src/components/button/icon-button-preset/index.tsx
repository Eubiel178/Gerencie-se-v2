import { IconName } from "../../icons";
import { ButtonRoot, ButtonRootProps } from "../button-root";
import { ButtonIcon } from "../button-icon";

import styles from "../styles.module.css";

type IconButtonPresetProps = Omit<ButtonRootProps, "variant" | "children"> & {
  icon: IconName;
};

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): sempre `variant="ghost"` + tamanho de ícone,
 * o ícone entra por nome (ex.: `icon="FaTrash"`) e é renderizado via
 * `Button.Icon`, que resolve o nome no componente global `Icon`. */
export function IconButtonPreset({ tone, className, icon, ...rest }: IconButtonPresetProps) {
  const classNames = className ? `${styles.iconButton} ${className}` : styles.iconButton;

  return (
    <ButtonRoot variant="ghost" tone={tone} className={classNames} {...rest}>
      <ButtonIcon icon={icon} />
    </ButtonRoot>
  );
}
