import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const NotificationHeader = ({
  children,
  className,
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={twMerge("flex items-center justify-between	", className)}>
      {children}
    </div>
  );
};
