import { HTMLProps } from "react";
import { twMerge } from "tailwind-merge";

interface NotificationHeaderProps extends HTMLProps<HTMLDivElement> {}

export const NotificationHeader = ({
  children,
  className = "",
}: NotificationHeaderProps) => {
  return (
    <div className={twMerge("flex items-center justify-between	", className)}>
      {children}
    </div>
  );
};
