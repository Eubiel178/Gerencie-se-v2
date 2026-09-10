"use client";

import { forwardRef, useState } from "react";
import { VariantProps, tv } from "tailwind-variants";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useInputRootContext } from "@/providers/input-root-context";

import { InputButton } from "./input-button";
import { InputIcon } from "./input-icon";

const inputStyles = tv({
  base: "w-full border border-solid border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] p-2",

  variants: {
    incorrect: {
      true: "border-[var(--color-danger)] placeholder:text-[var(--color-danger)]",
      false: "border-[var(--color-border)]",
    },
  },
});

type InputFieldPasswordProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputStyles>;

export const InputFieldPassword = forwardRef<
  HTMLInputElement,
  InputFieldPasswordProps
>(({ name, placeholder, ...rest }, ref) => {
  const { sharedProps } = useInputRootContext();
  const incorrect = sharedProps?.error ? true : false;

  const [isVisible, setVisible] = useState(false);

  const checkVisibility = <T,>(value: T, newValue: T): T => {
    return isVisible ? value : newValue;
  };

  return (
    <>
      <input
        {...rest}
        className={inputStyles({ incorrect: incorrect })}
        type={checkVisibility("text", "password")}
        name={name}
        id={name}
        placeholder={placeholder}
        ref={ref}
      />

      <InputButton onClick={(): void => setVisible(!isVisible)}>
        <InputIcon>{checkVisibility(<FaEyeSlash />, <FaEye />)}</InputIcon>
      </InputButton>
    </>
  );
});
