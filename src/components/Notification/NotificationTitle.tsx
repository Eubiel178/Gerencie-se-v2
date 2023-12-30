import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const NotificationTitle = ({
  children,
  className,
}: HTMLAttributes<HTMLHeadingElement>) => {
  return <h3 className={twMerge("font-semibold", className)}>{children}</h3>;
};
