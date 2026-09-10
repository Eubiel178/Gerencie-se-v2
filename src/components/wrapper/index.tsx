import styles from "./styles.module.css";

type WrapperProps = React.ComponentProps<"div"> & {
  flex?: "flex1" | "flex2" | "flex3";
  display?: "flex" | "block";
  direction?: "row" | "column";
  background?: "light" | "dark" | "transparent";
  gap?: "xsmall" | "small" | "medium" | "large" | "xlarge";
  justify?: "start" | "center" | "end" | "between" | "stretch";
  align?: "start" | "center" | "end" | "stretch";
  shadow?: "xsmall" | "small" | "medium" | "large" | "xlarge";
  padding?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

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
    styles[`display${capitalize(display)}`],
    direction && styles[`direction${capitalize(direction)}`],
    flex && styles[flex],
    background && styles[`bg${capitalize(background)}`],
    gap && styles[`gap${capitalize(gap)}`],
    justify && styles[`justify${capitalize(justify)}`],
    align && styles[`align${capitalize(align)}`],
    shadow && styles[`shadow${capitalize(shadow)}`],
    padding && styles[`padding${capitalize(padding)}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames}>{children}</div>;
};
