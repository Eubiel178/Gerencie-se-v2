import { ElementType, SVGAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const svg = tv({
  base: "bg-stone-200 text-xl",
});

interface InputIconProps
  extends SVGAttributes<SVGAElement>,
    VariantProps<typeof svg> {
  icon: ElementType;
}

export const InputIcon = ({ icon: Icon }: InputIconProps) => {
  return <Icon className={svg()} />;
};
