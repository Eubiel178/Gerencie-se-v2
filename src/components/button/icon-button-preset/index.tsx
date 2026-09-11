import { Button } from "..";
import { IconName } from "../../icons";

import styles from "../styles.module.css";

type IconButtonPresetProps = Omit<React.ComponentProps<typeof Button.Root>, "variant" | "children"> & {
  icon: IconName;
};

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): sempre `variant="ghost"` + tamanho de ícone,
 * o ícone entra por nome (ex.: `icon="FaTrash"`) e é renderizado via
 * `Button.Icon`, que resolve o nome no componente global `Icon`. Montado
 * a partir do próprio `Button` (Button.Root + Button.Icon), igual
 * qualquer outra tela monta. */
export function IconButtonPreset({ tone, className, icon, ...rest }: IconButtonPresetProps) {
  const classNames = className ? `${styles.iconButton} ${className}` : styles.iconButton;

  return (
    <Button.Root variant="ghost" tone={tone} className={classNames} {...rest}>
      <Button.Icon icon={icon} />
    </Button.Root>
  );
}
