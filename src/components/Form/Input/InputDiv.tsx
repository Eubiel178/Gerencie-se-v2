import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const div = tv({
  base: "flex items-stretch",
});

interface InputDivProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof div> {}

export const InputDiv = ({ children }: InputDivProps) => {
  return <div className={div()}>{children}</div>;
};
