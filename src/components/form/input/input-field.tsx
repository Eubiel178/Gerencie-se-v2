import { forwardRef } from "react";

import { useInputRootContext } from "@/providers/input-root-context";

import styles from "./styles.module.css";

type InputFieldProps = React.ComponentProps<"input">;

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ type = "text", name, placeholder, className, ...rest }, ref) => {
    const { sharedProps } = useInputRootContext();
    const incorrect = Boolean(sharedProps?.error);

    let classNames = styles.field;

    if (incorrect) {
      classNames = classNames + " " + styles.incorrect;
    }

    if (className) {
      classNames = classNames + " " + className;
    }

    return (
      <input
        {...rest}
        className={classNames}
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        ref={ref}
      />
    );
  }
);
