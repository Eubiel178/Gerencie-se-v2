import styles from "./styles.module.css";

type InputButtonProps = React.ComponentProps<"button">;

export const InputButton = ({ children, ...rest }: InputButtonProps) => {
  return (
    <button {...rest} type="button" className={styles.button}>
      {children}
    </button>
  );
};
