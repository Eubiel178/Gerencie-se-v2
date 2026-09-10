import styles from "./styles.module.css";

type ButtonProps = React.ComponentProps<"button"> & {
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
  color = "primary",
  background = "primary",
  radius = "square",
  disabled,
  size,
  className,
  ...rest
}: ButtonProps) => {
  const isDisabled = loading || disabled;

  const classNames = [
    styles.button,
    styles[`color${capitalize(color)}`],
    styles[`background${capitalize(background)}`],
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
