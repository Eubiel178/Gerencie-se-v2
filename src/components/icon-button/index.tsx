import { Button } from "../button";

type IconButtonProps = Omit<React.ComponentProps<typeof Button.Root>, "variant"> & {
  size?: "icon" | "sm";
};

/** Botão só de ícone (excluir, editar, fechar — o mesmo visual se repetia
 * em muitos lugares do app): sempre `variant="ghost"`, ícone entra como
 * `children` — composição, igual `Input.Root` — via `Button.Icon`. */
export function IconButton({ size = "icon", tone, children, ...rest }: IconButtonProps) {
  return (
    <Button.Root variant="ghost" size={size} tone={tone} {...rest}>
      <Button.Icon>{children}</Button.Icon>
    </Button.Root>
  );
}
