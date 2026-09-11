import styles from "./styles.module.css";

type FormWrapperProps = React.ComponentProps<"div">;

export const FormWrapper = ({ children, className, ...rest }: FormWrapperProps) => {
  const classNames = className ? `${styles.wrapper} ${className}` : styles.wrapper;

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
};
