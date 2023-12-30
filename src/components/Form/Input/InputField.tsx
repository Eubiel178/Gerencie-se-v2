import { InputHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface InputField extends InputHTMLAttributes<HTMLInputElement> {}

export const InputField = forwardRef<HTMLInputElement, InputField>(
  ({ className, type = "text", name, placeholder, ...rest }, ref) => {
    return (
      <input
        {...rest}
        type={type}
        className={twMerge(
          "w-full border border-solid border-stone-200 p-2",
          className
        )}
        name={name}
        id={name}
        placeholder={placeholder}
        ref={ref}
      />
    );
  }
);
