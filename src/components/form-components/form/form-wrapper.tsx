import { VariantProps, tv } from "tailwind-variants";

const wrapperStyles = tv({
  base: "flex gap-6",

  variants: {
    direction: {
      column: "flex-col",
      row: "flex-row",
    },

    gap: {
      xsmall: "gap-3",
      small: "gap-6",
    },
  },

  defaultVariants: { direction: "column", gap: "xsmall" },
});

type FormWrapperProps = React.ComponentProps<"div"> &
  VariantProps<typeof wrapperStyles>;

export const FormWrapper = ({ children, direction, gap }: FormWrapperProps) => {
  return <div className={wrapperStyles({ direction, gap })}>{children}</div>;
};
