import { Button } from "../button";

import styles from "./styles.module.css";

type IconButtonProps = Omit<React.ComponentProps<typeof Button.Root>, "variant">;

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): sempre `variant="ghost"`, ícone entra como
 * `children` — composição, igual `Input.Root` — via `Button.Icon`. */
export function IconButton({ tone, className, children, ...rest }: IconButtonProps) {
  const classNames = className ? `${styles.iconButton} ${className}` : styles.iconButton;

  return (
    <Button.Root variant="ghost" tone={tone} className={classNames} {...rest}>
      <Button.Icon>{children}</Button.Icon>
    </Button.Root>
  );
}
