"use client";

import { forwardRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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

  const classNames = [styles.field, incorrect && styles.incorrect]
    .filter(Boolean)
    .join(" ");

  return (
    <>
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
        type="button"
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setVisible(!isVisible)}
      >
        <InputIcon>{isVisible ? <FaEyeSlash /> : <FaEye />}</InputIcon>
      </InputButton>
    </>
  );
});
