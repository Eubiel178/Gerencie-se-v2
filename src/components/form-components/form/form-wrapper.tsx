import styles from "./styles.module.css";

type FormWrapperDirection = "column" | "row";
type FormWrapperGap = "xsmall" | "small";

type FormWrapperProps = React.ComponentProps<"div"> & {
  direction?: FormWrapperDirection;
  gap?: FormWrapperGap;
};

const DIRECTION_CLASSES: Record<FormWrapperDirection, string> = {
  column: styles.directionColumn,
  row: styles.directionRow,
};

const GAP_CLASSES: Record<FormWrapperGap, string> = {
  xsmall: styles.gapXsmall,
  small: styles.gapSmall,
};

export const FormWrapper = ({
  children,
  direction = "column",
  gap = "xsmall",
  className,
}: FormWrapperProps) => {
  const classNames = [
    styles.wrapper,
    DIRECTION_CLASSES[direction],
    GAP_CLASSES[gap],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames}>{children}</div>;
};
