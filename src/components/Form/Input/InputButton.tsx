import { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const InputButton = ({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...rest}
      type="button"
      className={twMerge("bg-stone-200 p-1.5", className)}
    >
      {children}
    </button>
  );
};
