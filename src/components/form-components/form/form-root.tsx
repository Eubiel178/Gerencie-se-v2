import { VariantProps, tv } from "tailwind-variants";

const formStyles = tv({
  base: "flex w-full",

  variants: {
    direction: {
      column: "flex-col",
      row: "flex-row",
    },

    justify: {
      center: "justify-center",
      between: "justify-between",
      stretch: "justify-stretch",
    },

    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },

    gap: {
      xsmall: "gap-3",
      small: "gap-6",
      medium: "gap-8",
      large: "gap-16",
    },
  },

  defaultVariants: { direction: "column", gap: "large" },
});

type FormRootrops = React.ComponentProps<"form"> &
  VariantProps<typeof formStyles>;

export const FormRoot = ({
  children,
  onSubmit,
  direction,
  gap,
  className,
}: FormRootrops) => {
  return (
    <form
      className={formStyles({ direction, gap, className })}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
};
