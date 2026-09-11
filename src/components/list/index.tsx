import styles from "./styles.module.css";

type ListDirection = "row" | "column";
type ListWrap = "nowrap" | "wrap";

type ListProps = React.ComponentProps<"ul"> & {
  direction?: ListDirection;
  wrap?: ListWrap;
};

const DIRECTION_CLASSES: Record<ListDirection, string> = {
  row: styles.directionRow,
  column: styles.directionColumn,
};

const WRAP_CLASSES: Record<ListWrap, string> = {
  nowrap: styles.wrapNowrap,
  wrap: styles.wrapWrap,
};

export const List = ({
  children,
  direction,
  wrap = "wrap",
  className,
  ...rest
}: ListProps) => {
  const classNames = [
    styles.list,
    direction && DIRECTION_CLASSES[direction],
    WRAP_CLASSES[wrap],
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
