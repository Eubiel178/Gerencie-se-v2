import { forwardRef } from "react";

import { useInputRootContext } from "@/providers/input-root-context";

import styles from "./styles.module.css";

type InputFieldTextareaProps = React.ComponentProps<"textarea">;

export const InputFieldTextarea = forwardRef<
  HTMLTextAreaElement,
  InputFieldTextareaProps
>(({ name, placeholder, className, ...rest }, ref) => {
  const { sharedProps } = useInputRootContext();
  const incorrect = Boolean(sharedProps?.error);

  let classNames = `${styles.field} ${styles.textarea}`;

  if (incorrect) {
    classNames = classNames + " " + styles.incorrect;
  }

  if (className) {
    classNames = classNames + " " + className;
  }

  return (
    <textarea
      {...rest}
      className={classNames}
      name={name}
      id={name}
      placeholder={placeholder}
      ref={ref}
    />
  );
});
