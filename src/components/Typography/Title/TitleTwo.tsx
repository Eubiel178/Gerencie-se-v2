import { twMerge } from "tailwind-merge";
import { TitleProps } from "./type";

export const TitleTwo = ({ children, className = "" }: TitleProps) => {
  return (
    <h2 className={twMerge("text-xl font-extrabold", className)}>{children}</h2>
  );
};
