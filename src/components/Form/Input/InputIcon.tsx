import { ButtonHTMLAttributes, ElementType } from "react";
import { twMerge } from "tailwind-merge";

interface InputIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ElementType;
}

export const InputIcon = ({
  icon: Icon,
  className = "",
  ...rest
}: InputIconProps) => {
  return (
    <button
      type="button"
      className={twMerge("bg-stone-200 p-1.5	", className)}
      {...rest}
    >
      <Icon />
    </button>
  );
};
