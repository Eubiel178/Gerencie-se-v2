import styles from "./styles.module.css";

type InputLabelProps = React.ComponentProps<"label"> & {
  size?: "small" | "medium" | "large";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const InputLabel = ({ children, htmlFor, size }: InputLabelProps) => {
  const classNames = [styles.label, size && styles[`label${capitalize(size)}`]]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classNames} htmlFor={htmlFor}>
      {children}
    </label>
  );
};
