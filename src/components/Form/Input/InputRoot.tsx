import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const div = tv({
  base: "flex flex-col gap-2",
});

interface InputRootProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof div> {}

export const InputRoot = ({ children, className }: InputRootProps) => {
  return <div className={div()}>{children}</div>;
};
