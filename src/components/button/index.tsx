import styles from "./styles.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm" | "icon";
type ButtonTone = "danger" | "highlight" | "muted";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: styles.md,
  sm: styles.sm,
  icon: styles.sizeIcon,
};

const TONE_CLASS: Record<ButtonTone, string> = {
  danger: styles.toneDanger,
  highlight: styles.toneHighlight,
  muted: styles.toneMuted,
};

type ButtonRootProps = React.ComponentProps<"button"> & {
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
};

function ButtonRoot({
  loading = false,
  variant = "primary",
  size = "md",
  tone,
  children,
  disabled,
  className,
  ...rest
}: ButtonRootProps) {
  let classNames = `${styles.button} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]}`;

  if (tone) {
    classNames = classNames + " " + TONE_CLASS[tone];
  }

  if (className) {
    classNames = classNames + " " + className;
  }

  return (
    <button
      className={classNames}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}

function ButtonIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.icon}>{children}</span>;
}

export const Button = {
  Root: ButtonRoot,
  Icon: ButtonIcon,
};
