import styles from "./styles.module.css";

type FormRootDirection = "column" | "row";
type FormRootJustify = "center" | "between" | "stretch";
type FormRootAlign = "start" | "center" | "end" | "stretch";
type FormRootGap = "xsmall" | "small" | "medium" | "large";

type FormRootProps = React.ComponentProps<"form"> & {
  direction?: FormRootDirection;
  justify?: FormRootJustify;
  align?: FormRootAlign;
  gap?: FormRootGap;
};

const DIRECTION_CLASSES: Record<FormRootDirection, string> = {
  column: styles.directionColumn,
  row: styles.directionRow,
};

const JUSTIFY_CLASSES: Record<FormRootJustify, string> = {
  center: styles.justifyCenter,
  between: styles.justifyBetween,
  stretch: styles.justifyStretch,
};

const ALIGN_CLASSES: Record<FormRootAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
};

const GAP_CLASSES: Record<FormRootGap, string> = {
  xsmall: styles.gapXsmall,
  small: styles.gapSmall,
  medium: styles.gapMedium,
  large: styles.gapLarge,
};

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
    DIRECTION_CLASSES[direction],
    justify && JUSTIFY_CLASSES[justify],
    align && ALIGN_CLASSES[align],
    GAP_CLASSES[gap],
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
