"use client";

import { forwardRef, useState } from "react";

import { useInputRootContext } from "@/providers/input-root-context";

import { InputButton } from "./input-button";
import { InputIcon } from "./input-icon";
import styles from "./styles.module.css";

type InputFieldPasswordProps = React.ComponentProps<"input">;

export const InputFieldPassword = forwardRef<
  HTMLInputElement,
  InputFieldPasswordProps
>(({ name, placeholder, ...rest }, ref) => {
  const { sharedProps } = useInputRootContext();
  const incorrect = Boolean(sharedProps?.error);

  const [isVisible, setVisible] = useState(false);

  let classNames = `${styles.field} ${styles.passwordField}`;

  if (incorrect) {
    classNames = classNames + " " + styles.incorrect;
  }

  return (
    <div className={styles.passwordWrapper}>
      <input
        {...rest}
        className={classNames}
        type={isVisible ? "text" : "password"}
        name={name}
        id={name}
        placeholder={placeholder}
        ref={ref}
      />

      <InputButton
        className={styles.passwordToggle}
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setVisible(!isVisible)}
      >
        <InputIcon
          className={styles.icon}
          name={isVisible ? "FaEyeSlash" : "FaEye"}
        />
      </InputButton>
    </div>
  );
});
