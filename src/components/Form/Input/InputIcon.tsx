import { ComponentProps, ElementType, SVGAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface InputIconProps extends SVGAttributes<SVGAElement> {
  icon: ElementType;
}

export const InputIcon = ({ icon: Icon, className }: InputIconProps) => {
  return <Icon className={twMerge("bg-stone-200 text-xl", className)} />;
};
