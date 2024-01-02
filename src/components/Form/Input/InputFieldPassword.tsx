import { InputHTMLAttributes, forwardRef, useState } from "react";
import { VariantProps, tv } from "tailwind-variants";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { InputButton } from "./InputButton";
import { InputIcon } from "./InputIcon";

const input = tv({
  base: "w-full border border-solid border-stone-200 p-2",
});

interface InputFieldPassword
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof input> {}

export const InputFieldPassword = forwardRef<
  HTMLInputElement,
  InputFieldPassword
>(({ name, placeholder, ...rest }, ref) => {
  const [isVisible, setVisible] = useState<boolean>(false);

  return (
    <>
      <input
        {...rest}
        type={isVisible ? "text" : "password"}
        className={input()}
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
