import styles from "./styles.module.css";

type FeedbackProps = React.ComponentProps<"p"> & {
  type?: "error" | "success" | "warning" | "info";
  size?: "xSmall" | "small" | "medium" | "large";
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const Feedback = ({
  children,
  type = "info",
  size = "medium",
}: FeedbackProps) => {
  const classNames = [
    styles.feedback,
    styles[`type${capitalize(type)}`],
    styles[`size${capitalize(size)}`],
  ]
    .filter(Boolean)
    .join(" ");

  return <p className={classNames}>{children}</p>;
};
