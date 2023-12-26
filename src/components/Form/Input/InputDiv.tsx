import { HTMLProps } from "react";
import { twMerge } from "tailwind-merge";

interface InputDivProps extends HTMLProps<HTMLDivElement> {}

export const InputDiv = ({ children, className = "" }: InputDivProps) => {
  return (
    <div
      className={twMerge(
        "flex items-stretch [&_input]:w-full [&_input]:border [&_input]:border-solid [&_input]:border-stone-200 [&_input]:p-2 [&_select]:w-full [&_select]:border [&_select]:border-solid [&_select]:border-stone-200 [&_select]:p-2",
        className
      )}
    >
      {children}
    </div>
  );
};
