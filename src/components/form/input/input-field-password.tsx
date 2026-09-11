"use client";

import { forwardRef, useState } from "react";
import { FaEye, FaEyeSlash } from "@/components/icons";

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

  const classNames = [styles.field, styles.passwordField, incorrect && styles.incorrect]
    .filter(Boolean)
    .join(" ");

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
        <InputIcon>{isVisible ? <FaEyeSlash /> : <FaEye />}</InputIcon>
      </InputButton>
    </div>
  );
});
