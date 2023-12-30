import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const InputDiv = ({
  children,
  className,
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={twMerge("flex items-stretch", className)}>{children}</div>
  );
};
