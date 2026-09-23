import styles from "./styles.module.css";

type FormRootProps = React.ComponentProps<"form">;

export const FormRoot = ({ children, onSubmit, className, ...rest }: FormRootProps) => {
  const classNames = `${styles.root} ${className || ""}`;

  return (
    <form className={classNames} onSubmit={onSubmit} {...rest}>
      {children}
    </form>
  );
};
