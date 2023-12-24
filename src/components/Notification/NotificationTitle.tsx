import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface NotificationTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  title: string;
}

export const NotificationTitle = ({
  title,
  className = "",
}: NotificationTitleProps) => {
  return <h3 className={twMerge("font-semibold", className)}>{title}</h3>;
};
