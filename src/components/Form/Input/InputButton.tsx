import { ButtonHTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const button = tv({
  base: "bg-stone-200 p-1.5",
});

interface InputButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const InputButton = ({ children, ...rest }: InputButtonProps) => {
  return (
    <button {...rest} type="button" className={button()}>
      {children}
    </button>
  );
};
