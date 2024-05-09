import { VariantProps, tv } from "tailwind-variants";

const wrapperStyles = tv({
  base: "flex items-stretch",

  variants: {
    gap: {
      small: "gap-1",
    },
  },
});

type InputWrapperProps = React.ComponentProps<"div"> &
  VariantProps<typeof wrapperStyles>;

export const InputWrapper = ({ children, gap }: InputWrapperProps) => {
  return <div className={wrapperStyles({ gap })}>{children}</div>;
};
