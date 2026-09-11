import styles from "./styles.module.css";

type InputLabelProps = React.ComponentProps<"label">;

export const InputLabel = ({ children, htmlFor, className, ...rest }: InputLabelProps) => {
  const classNames = [styles.label, className].filter(Boolean).join(" ");

  return (
    <label className={classNames} htmlFor={htmlFor} {...rest}>
      {children}
    </label>
  );
};
