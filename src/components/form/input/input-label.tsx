import styles from "./styles.module.css";

type InputLabelProps = React.ComponentProps<"label">;

export const InputLabel = ({ children, htmlFor, className, ...rest }: InputLabelProps) => {
  const classNames = className ? `${styles.label} ${className}` : styles.label;

  return (
    <label className={classNames} htmlFor={htmlFor} {...rest}>
      {children}
    </label>
  );
};
