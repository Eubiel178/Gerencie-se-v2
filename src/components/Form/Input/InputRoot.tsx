import { RootComponentProps } from "@/types/RootComponentProps";
import { twMerge } from "tailwind-merge";

interface InputRootProps extends RootComponentProps {}

export const InputRoot = ({ children, className = "" }: InputRootProps) => {
  return (
    <div className={twMerge("flex flex-col gap-2", className)}>{children}</div>
  );
};
