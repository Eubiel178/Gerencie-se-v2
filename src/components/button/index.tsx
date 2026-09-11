import styles from "./styles.module.css";

type ButtonProps = React.ComponentProps<"button"> & {
  loading?: boolean;
};

const ButtonBase = ({ loading = false, children, disabled, className, ...rest }: ButtonProps) => {
  const classNames = className ? `${styles.button} ${className}` : styles.button;

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

function ButtonIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.icon}>{children}</span>;
}

export const Button = Object.assign(ButtonBase, { Icon: ButtonIcon });
