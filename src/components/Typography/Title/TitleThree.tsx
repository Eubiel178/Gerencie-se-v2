import { twMerge } from "tailwind-merge";
import { TitleProps } from "./type";

export const TitleThree = ({ children, className = "" }: TitleProps) => {
  return (
    <h3 className={twMerge("text-lg font-bold", className)}>{children}</h3>
  );
};
