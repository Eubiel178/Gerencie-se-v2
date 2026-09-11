import styles from "./styles.module.css";

type FormRootProps = React.ComponentProps<"form">;

export const FormRoot = ({ children, onSubmit, className, ...rest }: FormRootProps) => {
  const classNames = className ? `${styles.root} ${className}` : styles.root;

  return (
    <form className={classNames} onSubmit={onSubmit} {...rest}>
      {children}
    </form>
  );
};
