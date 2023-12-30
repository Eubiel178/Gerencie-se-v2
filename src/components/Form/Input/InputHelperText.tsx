import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface InputHelperText extends HTMLAttributes<HTMLParagraphElement> {
  error?: string;
}

export const InputHelperText = ({ error, className }: InputHelperText) => {
  return (
    <>
      {error && (
        <p className={twMerge("text-xs text-red-500", className)}>{error}</p>
      )}
    </>
  );
};
