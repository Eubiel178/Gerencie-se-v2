import styles from "./styles.module.css";

type ButtonProps = React.ComponentProps<"button"> & {
  // Sem valor: a cor do texto/ícone vem do `background` escolhido (ver
  // `.background*` no CSS) — cada fundo já define uma cor legível própria.
  // Só passe `color` para forçar uma cor específica (ex.: um ícone
  // "danger" dentro de um botão transparente).
  color?: "primary" | "secondary" | "danger";
  background?: "transparent" | "primary" | "secondary";
  radius?: "square" | "rounded" | "lg" | "md" | "sm";
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge";
  loading?: boolean;
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const Button = ({
  loading = false,
  children,
  color,
  background = "primary",
  radius = "md",
  disabled,
  size = "medium",
  className,
  ...rest
}: ButtonProps) => {
  const isDisabled = loading || disabled;

  const classNames = [
    styles.button,
    styles[`background${capitalize(background)}`],
    // A cor padrão de cada fundo vive numa regra `:where(...)` no CSS
    // (especificidade zerada) — por isso esta classe, quando passada,
    // sempre vence, não importa a ordem no arquivo ou no array acima.
    color && styles[`color${capitalize(color)}`],
    styles[`radius${capitalize(radius)}`],
    size && styles[`size${capitalize(size)}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classNames}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
};
