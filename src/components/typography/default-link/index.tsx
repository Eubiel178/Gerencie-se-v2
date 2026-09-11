import Link from "next/link";

import styles from "./styles.module.css";

type DefaultLinkDisplay = "flex" | "block";
type DefaultLinkSize = "small" | "medium" | "large";
type DefaultLinkWidth = "fit";

type DefaultLinkProps = React.ComponentProps<typeof Link> & {
  display?: DefaultLinkDisplay;
  size?: DefaultLinkSize;
  width?: DefaultLinkWidth;
};

const DISPLAY_CLASSES: Record<DefaultLinkDisplay, string> = {
  flex: styles.displayFlex,
  block: styles.displayBlock,
};

const SIZE_CLASSES: Record<DefaultLinkSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

const WIDTH_CLASSES: Record<DefaultLinkWidth, string> = {
  fit: styles.widthFit,
};

export const DefaultLink = ({
  size,
  href,
  width,
  display = "block",
  children,
  className,
  ...rest
}: DefaultLinkProps) => {
  const classNames = [
    styles.link,
    DISPLAY_CLASSES[display],
    size && SIZE_CLASSES[size],
    width && WIDTH_CLASSES[width],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={classNames} href={href} {...rest}>
      {children}
    </Link>
  );
};
