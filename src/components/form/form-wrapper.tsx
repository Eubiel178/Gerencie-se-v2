import styles from "./styles.module.css";

type FormWrapperProps = React.ComponentProps<"div">;

export const FormWrapper = ({ children, className, ...rest }: FormWrapperProps) => {
  const classNames = [styles.wrapper, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
};
