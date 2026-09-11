import styles from "./styles.module.css";

type InputLabelSize = "small" | "medium" | "large";

type InputLabelProps = React.ComponentProps<"label"> & {
  size?: InputLabelSize;
};

const SIZE_CLASSES: Record<InputLabelSize, string> = {
  small: styles.labelSmall,
  medium: styles.labelMedium,
  large: styles.labelLarge,
};

export const InputLabel = ({ children, htmlFor, size }: InputLabelProps) => {
  const classNames = [styles.label, size && SIZE_CLASSES[size]].filter(Boolean).join(" ");

  return (
    <label className={classNames} htmlFor={htmlFor}>
      {children}
    </label>
  );
};
