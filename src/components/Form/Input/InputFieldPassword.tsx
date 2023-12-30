import { InputHTMLAttributes, forwardRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { InputButton } from "./InputButton";
import { InputIcon } from "./InputIcon";

interface InputFieldPassword extends InputHTMLAttributes<HTMLInputElement> {}

export const InputFieldPassword = forwardRef<
  HTMLInputElement,
  InputFieldPassword
>(({ className, name, placeholder, ...rest }, ref) => {
  const [isVisible, setVisible] = useState<boolean>(false);

  return (
    <>
      <input
        {...rest}
        type={isVisible ? "text" : "password"}
        className={twMerge(
          "w-full border border-solid border-stone-200 p-2 ",
          className
        )}
        name={name}
        id={name}
        placeholder={placeholder}
        ref={ref}
      />

      <InputButton onClick={(): void => setVisible(!isVisible)}>
        <InputIcon icon={isVisible ? FaEyeSlash : FaEye} />
      </InputButton>
    </>
  );
});
