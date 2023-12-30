import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const NotificationContent = ({
  children,
  className,
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={twMerge("flex flex-col gap-5", className)}>{children}</div>
  );
};
