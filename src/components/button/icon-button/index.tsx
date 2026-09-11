import { ButtonRoot, ButtonRootProps } from "../button-root";
import { ButtonIcon, IconElement } from "../button-icon";

import styles from "../styles.module.css";

type IconButtonPresetProps = Omit<ButtonRootProps, "variant" | "children"> & {
  children: IconElement;
};

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): sempre `variant="ghost"` + tamanho de ícone,
 * ícone entra como `children` — composição, igual `Input.Root` — via
 * `Button.Icon`. */
export function IconButtonPreset({ tone, className, children, ...rest }: IconButtonPresetProps) {
  const classNames = className ? `${styles.iconButton} ${className}` : styles.iconButton;

  return (
    <ButtonRoot variant="ghost" tone={tone} className={classNames} {...rest}>
      <ButtonIcon>{children}</ButtonIcon>
    </ButtonRoot>
  );
}
