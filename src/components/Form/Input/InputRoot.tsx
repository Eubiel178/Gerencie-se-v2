import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const InputRoot = ({
  children,
  className,
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={twMerge("flex flex-col gap-2", className)}>{children}</div>
  );
};
