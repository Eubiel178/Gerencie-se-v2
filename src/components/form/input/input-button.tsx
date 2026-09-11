import styles from "./styles.module.css";

type InputButtonProps = React.ComponentProps<"button">;

export const InputButton = ({ children, className, ...rest }: InputButtonProps) => {
  const classNames = className ? `${styles.button} ${className}` : styles.button;

  return (
    <button {...rest} type="button" className={classNames}>
      {children}
    </button>
  );
};
