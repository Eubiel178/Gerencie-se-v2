import styles from "./styles.module.css";

type WrapperFlex = "flex1" | "flex2" | "flex3";
type WrapperDisplay = "flex" | "block";
type WrapperDirection = "row" | "column";
type WrapperBackground = "light" | "dark" | "transparent";
type WrapperGap = "xsmall" | "small" | "medium" | "large" | "xlarge";
type WrapperJustify = "start" | "center" | "end" | "between" | "stretch";
type WrapperAlign = "start" | "center" | "end" | "stretch";
type WrapperShadow = "xsmall" | "small" | "medium" | "large" | "xlarge";
type WrapperPadding = "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";

type WrapperProps = React.ComponentProps<"div"> & {
  flex?: WrapperFlex;
  display?: WrapperDisplay;
  direction?: WrapperDirection;
  background?: WrapperBackground;
  gap?: WrapperGap;
  justify?: WrapperJustify;
  align?: WrapperAlign;
  shadow?: WrapperShadow;
  padding?: WrapperPadding;
};

const FLEX_CLASSES: Record<WrapperFlex, string> = {
  flex1: styles.flex1,
  flex2: styles.flex2,
  flex3: styles.flex3,
};

const DISPLAY_CLASSES: Record<WrapperDisplay, string> = {
  flex: styles.displayFlex,
  block: styles.displayBlock,
};

const DIRECTION_CLASSES: Record<WrapperDirection, string> = {
  row: styles.directionRow,
  column: styles.directionColumn,
};

const BACKGROUND_CLASSES: Record<WrapperBackground, string> = {
  light: styles.bgLight,
  dark: styles.bgDark,
  transparent: styles.bgTransparent,
};

const GAP_CLASSES: Record<WrapperGap, string> = {
  xsmall: styles.gapXsmall,
  small: styles.gapSmall,
  medium: styles.gapMedium,
  large: styles.gapLarge,
  xlarge: styles.gapXlarge,
};

const JUSTIFY_CLASSES: Record<WrapperJustify, string> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween,
  stretch: styles.justifyStretch,
};

const ALIGN_CLASSES: Record<WrapperAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
};

const SHADOW_CLASSES: Record<WrapperShadow, string> = {
  xsmall: styles.shadowXsmall,
  small: styles.shadowSmall,
  medium: styles.shadowMedium,
  large: styles.shadowLarge,
  xlarge: styles.shadowXlarge,
};

const PADDING_CLASSES: Record<WrapperPadding, string> = {
  xsmall: styles.paddingXsmall,
  small: styles.paddingSmall,
  medium: styles.paddingMedium,
  large: styles.paddingLarge,
  xlarge: styles.paddingXlarge,
  xxlarge: styles.paddingXxlarge,
};

export const Wrapper = ({
  children,
  flex,
  display = "flex",
  direction,
  background,
  gap,
  justify,
  align,
  shadow,
  padding,
  className,
}: WrapperProps) => {
  const classNames = [
    styles.wrapper,
    DISPLAY_CLASSES[display],
    direction && DIRECTION_CLASSES[direction],
    flex && FLEX_CLASSES[flex],
    background && BACKGROUND_CLASSES[background],
    gap && GAP_CLASSES[gap],
    justify && JUSTIFY_CLASSES[justify],
    align && ALIGN_CLASSES[align],
    shadow && SHADOW_CLASSES[shadow],
    padding && PADDING_CLASSES[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames}>{children}</div>;
};
