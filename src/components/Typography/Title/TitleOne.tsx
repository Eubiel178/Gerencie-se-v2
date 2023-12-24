import { twMerge } from "tailwind-merge";
import { TitleProps } from "./type";

export const TitleOne = ({ text, className = "" }: TitleProps) => {
  return <h1 className={twMerge("text-2xl font-black", className)}>{text}</h1>;
};
