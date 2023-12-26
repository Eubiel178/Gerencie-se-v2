import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface TextSmallProps extends HTMLAttributes<HTMLParagraphElement> {
  text: string;
}

export const TextSmall = ({ text, className }: TextSmallProps) => {
  return <p className={twMerge("text-xs", className)}>{text}</p>;
};
