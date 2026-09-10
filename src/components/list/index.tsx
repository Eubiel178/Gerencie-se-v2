import styles from "./styles.module.css";

type ListProps = React.ComponentProps<"ul"> & {
  direction?: "row" | "column";
  wrap?: "nowrap" | "wrap";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const List = ({
  children,
  direction,
  wrap = "wrap",
  className,
  ...rest
}: ListProps) => {
  const classNames = [
    styles.list,
    direction && styles[`direction${capitalize(direction)}`],
    styles[`wrap${capitalize(wrap)}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ul className={classNames} {...rest}>
      {children}
    </ul>
  );
};
