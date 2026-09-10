import styles from "./styles.module.css";

type FormWrapperProps = React.ComponentProps<"div"> & {
  direction?: "column" | "row";
  gap?: "xsmall" | "small";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const FormWrapper = ({
  children,
  direction = "column",
  gap = "xsmall",
  className,
}: FormWrapperProps) => {
  const classNames = [
    styles.wrapper,
    styles[`direction${capitalize(direction)}`],
    styles[`gap${capitalize(gap)}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames}>{children}</div>;
};
