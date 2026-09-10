import styles from "./styles.module.css";

type FormRootProps = React.ComponentProps<"form"> & {
  direction?: "column" | "row";
  justify?: "center" | "between" | "stretch";
  align?: "start" | "center" | "end" | "stretch";
  gap?: "xsmall" | "small" | "medium" | "large";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const FormRoot = ({
  children,
  onSubmit,
  direction = "column",
  justify,
  align,
  gap = "large",
  className,
}: FormRootProps) => {
  const classNames = [
    styles.root,
    styles[`direction${capitalize(direction)}`],
    justify && styles[`justify${capitalize(justify)}`],
    align && styles[`align${capitalize(align)}`],
    styles[`gap${capitalize(gap)}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form className={classNames} onSubmit={onSubmit}>
      {children}
    </form>
  );
};
