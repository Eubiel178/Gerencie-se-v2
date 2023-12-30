import { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const NotificationButton = ({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button className={twMerge("", className)} {...rest}>
      {children}
    </button>
  );
};
