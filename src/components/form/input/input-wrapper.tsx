import styles from "./styles.module.css";

type InputWrapperProps = React.ComponentProps<"div">;

export const InputWrapper = ({ children, className, ...rest }: InputWrapperProps) => {
  const classNames = `${styles.wrapper} ${className || ""}`;

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
};
