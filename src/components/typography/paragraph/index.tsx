import styles from "./styles.module.css";

type ParagraphColor = "muted" | "default" | "highlight";
type ParagraphWeight = "bold" | "medium" | "regular" | "light";
type ParagraphSize = "xsmall" | "small" | "medium" | "large";

type ParagraphProps = React.ComponentProps<"p"> & {
  color?: ParagraphColor;
  weight?: ParagraphWeight;
  size?: ParagraphSize;
};

const COLOR_CLASSES: Record<ParagraphColor, string> = {
  muted: styles.colorMuted,
  default: styles.colorDefault,
  highlight: styles.colorHighlight,
};

const WEIGHT_CLASSES: Record<ParagraphWeight, string> = {
  bold: styles.weightBold,
  medium: styles.weightMedium,
  regular: styles.weightRegular,
  light: styles.weightLight,
};

const SIZE_CLASSES: Record<ParagraphSize, string> = {
  xsmall: styles.sizeXsmall,
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export const Paragraph = ({
  children,
  color = "default",
  weight,
  size,
  className,
}: ParagraphProps) => {
  const classNames = [
    styles.paragraph,
    COLOR_CLASSES[color],
    weight && WEIGHT_CLASSES[weight],
    size && SIZE_CLASSES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <p className={classNames}>{children}</p>;
};
