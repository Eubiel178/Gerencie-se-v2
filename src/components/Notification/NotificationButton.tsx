import { ButtonHTMLAttributes, ElementType, HTMLProps } from "react";
import { twMerge } from "tailwind-merge";

interface NotificationButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ElementType;
}

export const NotificationButton = ({
  icon: Icon,
  className = "",
  ...rest
}: NotificationButtonProps) => {
  return (
    <button
      className={twMerge("font-semibold text-xl	text-2xl", className)}
      {...rest}
    >
      <Icon />
    </button>
  );
};
