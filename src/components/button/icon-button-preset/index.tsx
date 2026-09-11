import type { IconType } from "react-icons";

import { Button } from "..";

import styles from "../styles.module.css";

type IconButtonPresetProps = Omit<
  React.ComponentProps<typeof Button.Root>,
  "variant" | "children"
> & {
  icon: IconType;
};

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): sempre `variant="ghost"` + tamanho de ícone,
 * o ícone entra por composição via `Button.Icon`. Montado a partir do
 * próprio `Button` (Button.Root + Button.Icon), igual qualquer outra
 * tela monta. */
export function IconButtonPreset({
  tone,
  className,
  icon,
  ...rest
}: IconButtonPresetProps) {
  const classNames = className
    ? `${styles.iconButton} ${className}`
    : styles.iconButton;

  return (
    <Button.Root variant="ghost" tone={tone} className={classNames} {...rest}>
      <Button.Icon icon={icon} />
    </Button.Root>
  );
}
