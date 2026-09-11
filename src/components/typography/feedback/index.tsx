import styles from "./styles.module.css";

type FeedbackType = "error" | "success" | "warning" | "info";
type FeedbackSize = "xSmall" | "small" | "medium" | "large";

type FeedbackProps = React.ComponentProps<"p"> & {
  type?: FeedbackType;
  size?: FeedbackSize;
};

const TYPE_CLASSES: Record<FeedbackType, string> = {
  error: styles.typeError,
  success: styles.typeSuccess,
  warning: styles.typeWarning,
  info: styles.typeInfo,
};

const SIZE_CLASSES: Record<FeedbackSize, string> = {
  xSmall: styles.sizeXSmall,
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
};

export const Feedback = ({
  children,
  type = "info",
  size = "medium",
}: FeedbackProps) => {
  const classNames = [styles.feedback, TYPE_CLASSES[type], SIZE_CLASSES[size]]
    .filter(Boolean)
    .join(" ");

  return <p className={classNames}>{children}</p>;
};
