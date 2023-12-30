import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const NotificationText = ({
  children,
  className = "",
}: HTMLAttributes<HTMLParagraphElement>) => {
  return <p className={twMerge("", className)}>{children}</p>;
};
