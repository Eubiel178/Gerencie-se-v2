import styles from "./styles.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonTone = "muted" | "highlight" | "danger";
type ButtonSize = "xsmall" | "small" | "medium" | "large" | "xlarge";

type ButtonProps = React.ComponentProps<"button"> & {
  // Fundo do botão — cada um já define sua própria cor de texto/ícone
  // legível (ver CSS). Default "primary" cobre a maioria dos botões
  // (CTA principal de formulário); "ghost" é pra ícone-só sem fundo
  // (editar/excluir/fechar em cards e modais).
  variant?: ButtonVariant;
  // Tinge o texto/ícone sem trocar o fundo — só passe quando o padrão
  // do `variant` não for o que você quer (ex.: um ícone de excluir
  // vermelho dentro de um botão "ghost").
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
};

// Mapas explícitos prop → classe (em vez de montar o nome da classe com
// string dinâmica): TypeScript aponta na hora se faltar um caso, e
// nenhum valor pode "escorregar" pra uma classe inexistente em silêncio.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
};

const TONE_CLASSES: Record<ButtonTone, string> = {
  muted: styles.toneMuted,
  highlight: styles.toneHighlight,
  danger: styles.toneDanger,
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
  variant = "primary",
  tone,
  disabled,
  size = "medium",
  className,
  ...rest
}: ButtonProps) => {
  const isDisabled = loading || disabled;

  const classNames = [
    styles.button,
    VARIANT_CLASSES[variant],
    // A cor padrão de cada variante vive numa regra `:where(...)` no
    // CSS (especificidade zerada) — por isso esta classe, quando
    // passada, sempre vence, não importa a ordem no arquivo.
    tone && TONE_CLASSES[tone],
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
