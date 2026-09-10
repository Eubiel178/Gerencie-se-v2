import Link from "next/link";

import styles from "./styles.module.css";

type DefaultLinkProps = React.ComponentProps<typeof Link> & {
  display?: "flex" | "block";
  size?: "small" | "medium" | "large";
  width?: "fit";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

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
    styles[`display${capitalize(display)}`],
    size && styles[`size${capitalize(size)}`],
    width && styles[`width${capitalize(width)}`],
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
