import { Button } from "../button";

import styles from "./styles.module.css";

type IconButtonTone = "danger" | "highlight" | "muted";

const TONE_CLASS: Record<IconButtonTone, string> = {
  danger: styles.toneDanger,
  highlight: styles.toneHighlight,
  muted: styles.toneMuted,
};

type IconButtonProps = React.ComponentProps<typeof Button> & {
  tone?: IconButtonTone;
};

/** Botão só de ícone, sem fundo (o mesmo visual se repetia — excluir,
 * editar, fechar — em muitos lugares do app). O ícone entra como
 * `children`, igual qualquer `Button` normal — composição, não um prop
 * de configuração: `<IconButton tone="danger"><FaTrash /></IconButton>`. */
export function IconButton({ tone, className, children, ...rest }: IconButtonProps) {
  let classNames = styles.iconButton;

  if (tone) {
    classNames = classNames + " " + TONE_CLASS[tone];
  }

  if (className) {
    classNames = classNames + " " + className;
  }

  return (
    <Button className={classNames} {...rest}>
      <Button.Icon>{children}</Button.Icon>
    </Button>
  );
}
