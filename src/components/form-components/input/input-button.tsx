import styles from "./styles.module.css";

type InputButtonProps = React.ComponentProps<"button">;

export const InputButton = ({ children, className, ...rest }: InputButtonProps) => {
  const classNames = [styles.button, className].filter(Boolean).join(" ");

  return (
    <button {...rest} type="button" className={classNames}>
      {children}
    </button>
  );
};
