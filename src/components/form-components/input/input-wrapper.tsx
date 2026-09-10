import styles from "./styles.module.css";

type InputWrapperProps = React.ComponentProps<"div"> & {
  gap?: "small";
};

export const InputWrapper = ({ children, gap }: InputWrapperProps) => {
  const classNames = [styles.wrapper, gap === "small" && styles.gapSmall]
    .filter(Boolean)
    .join(" ");

  return <div className={classNames}>{children}</div>;
};
