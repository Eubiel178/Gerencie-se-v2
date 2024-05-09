import { VariantProps, tv } from "tailwind-variants";

const buttonStyles = tv({
  base: "bg-stone-200 p-1.5",
});

type InputButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonStyles>;

export const InputButton = ({ children, ...rest }: InputButtonProps) => {
  return (
    <button {...rest} type="button" className={buttonStyles()}>
      {children}
    </button>
  );
};
