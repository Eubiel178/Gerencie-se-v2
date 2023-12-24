import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface NotificationContentProps extends HTMLAttributes<HTMLDivElement> {
  text: string;
}

export const NotificationContent = ({
  text,
  className = "",
}: NotificationContentProps) => {
  return <p className={twMerge("", className)}>{text}</p>;
};
