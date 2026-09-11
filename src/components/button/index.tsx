import styles from "./styles.module.css";

type ButtonProps = React.ComponentProps<"button"> & {
  loading?: boolean;
};

export const Button = ({ loading = false, children, disabled, className, ...rest }: ButtonProps) => {
  const classNames = [styles.button, className].filter(Boolean).join(" ");

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
};
