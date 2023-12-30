import { HTMLAttributes, ElementType } from "react";
import { twMerge } from "tailwind-merge";

interface NotificationIconProps extends HTMLAttributes<HTMLParagraphElement> {
  icon: ElementType;
}

export const NotificationIcon = ({
  icon: Icon,
  className,
}: NotificationIconProps) => {
  return (
    <p className={twMerge("text-2xl", className)}>
      <Icon />
    </p>
  );
};
