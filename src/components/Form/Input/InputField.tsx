import { InputHTMLAttributes, forwardRef } from "react";
import { VariantProps, tv } from "tailwind-variants";

const input = tv({
  base: "w-full border border-solid border-stone-200 p-2",
});

interface InputField
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof input> {}

export const InputField = forwardRef<HTMLInputElement, InputField>(
  ({ type = "text", name, placeholder, ...rest }, ref) => {
    return (
      <input
        {...rest}
        type={type}
        className={input()}
        name={name}
        id={name}
        placeholder={placeholder}
        ref={ref}
      />
    );
  }
);
