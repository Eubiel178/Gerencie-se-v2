import { InputRootProvider, SharedProps } from "@/providers/input-root-context";

import styles from "./styles.module.css";

type InputRootDirection = "row" | "col";
type InputRootJustify = "center" | "between" | "stretch";
type InputRootAlign = "start" | "center" | "end" | "stretch";

type InputRootProps = React.ComponentProps<"div"> &
  SharedProps & {
    direction?: InputRootDirection;
    justify?: InputRootJustify;
    align?: InputRootAlign;
  };

const DIRECTION_CLASSES: Record<InputRootDirection, string> = {
  row: styles.directionRow,
  col: styles.directionCol,
};

const JUSTIFY_CLASSES: Record<InputRootJustify, string> = {
  center: styles.justifyCenter,
  between: styles.justifyBetween,
  stretch: styles.justifyStretch,
};

const ALIGN_CLASSES: Record<InputRootAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
};

export const InputRoot = ({
  children,
  direction = "col",
  justify,
  align,
  sharedProps,
}: InputRootProps) => {
  const classNames = [
    styles.root,
    DIRECTION_CLASSES[direction],
    justify && JUSTIFY_CLASSES[justify],
    align && ALIGN_CLASSES[align],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <InputRootProvider sharedProps={sharedProps}>
      <div className={classNames}>{children}</div>
    </InputRootProvider>
  );
};
