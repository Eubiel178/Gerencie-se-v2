import { RootComponentProps } from "@/types/RootComponentProps";
import { twMerge } from "tailwind-merge";

interface TitleRootProps extends RootComponentProps {}

export const TitleRoot = ({ children, className = "" }: TitleRootProps) => {
  return <div className={twMerge("", className)}>{children}</div>;
};
