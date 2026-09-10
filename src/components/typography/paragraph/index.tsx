import styles from "./styles.module.css";

type ParagraphProps = React.ComponentProps<"p"> & {
  color?: "primary" | "secondary" | "tertiary" | "quarternary" | "highlight";
  weight?: "bold" | "medium" | "regular" | "light";
  size?: "xsmall" | "small" | "medium" | "large";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const Paragraph = ({
  children,
  color = "quarternary",
  weight,
  size,
  className,
}: ParagraphProps) => {
  const classNames = [
    styles.paragraph,
    styles[`color${capitalize(color)}`],
    weight && styles[`weight${capitalize(weight)}`],
    size && styles[`size${capitalize(size)}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <p className={classNames}>{children}</p>;
};
