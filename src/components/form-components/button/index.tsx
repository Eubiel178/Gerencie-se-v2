import styles from "./styles.module.css";

type ButtonColor = "primary" | "secondary" | "danger";
type ButtonBackground = "transparent" | "primary" | "secondary";
type ButtonRadius = "square" | "rounded" | "lg" | "md" | "sm";
type ButtonSize = "xsmall" | "small" | "medium" | "large" | "xlarge";

type ButtonProps = React.ComponentProps<"button"> & {
  // Sem valor: a cor do texto/ícone vem do `background` escolhido (ver
  // `.background*` no CSS) — cada fundo já define uma cor legível própria.
  // Só passe `color` para forçar uma cor específica (ex.: um ícone
  // "danger" dentro de um botão transparente).
  color?: ButtonColor;
  background?: ButtonBackground;
  radius?: ButtonRadius;
  size?: ButtonSize;
  loading?: boolean;
};

// Mapas explícitos prop → classe (em vez de montar o nome da classe com
// string dinâmica): TypeScript aponta na hora se faltar um caso, e
// nenhum valor pode "escorregar" pra uma classe inexistente em silêncio.
const COLOR_CLASSES: Record<ButtonColor, string> = {
  primary: styles.colorPrimary,
  secondary: styles.colorSecondary,
  danger: styles.colorDanger,
};

const BACKGROUND_CLASSES: Record<ButtonBackground, string> = {
  transparent: styles.backgroundTransparent,
  primary: styles.backgroundPrimary,
  secondary: styles.backgroundSecondary,
};

const RADIUS_CLASSES: Record<ButtonRadius, string> = {
  square: styles.radiusSquare,
  rounded: styles.radiusRounded,
  lg: styles.radiusLg,
  md: styles.radiusMd,
  sm: styles.radiusSm,
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xsmall: styles.sizeXsmall,
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
  xlarge: styles.sizeXlarge,
};

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
    BACKGROUND_CLASSES[background],
    // A cor padrão de cada fundo vive numa regra `:where(...)` no CSS
    // (especificidade zerada) — por isso esta classe, quando passada,
    // sempre vence, não importa a ordem no arquivo ou no array abaixo.
    color && COLOR_CLASSES[color],
    RADIUS_CLASSES[radius],
    SIZE_CLASSES[size],
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
