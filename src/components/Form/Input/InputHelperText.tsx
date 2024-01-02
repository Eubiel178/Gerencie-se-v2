import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const helperText = tv({
  base: "text-red-500 text-xs",
});

interface InputHelperText
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof helperText> {
  error?: string;
}

export const InputHelperText = ({ error }: InputHelperText) => {
  return <>{error && <p className={helperText()}>{error}</p>}</>;
};
