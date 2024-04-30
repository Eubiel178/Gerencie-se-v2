import { InputRootProvider, SharedProps } from "@/providers/InputRootContext";
import { VariantProps, tv } from "tailwind-variants";

const rootStyles = tv({
  base: "flex gap-2",

  variants: {
    direction: {
      row: "flex-row",
      col: "flex-col",
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
  },

  defaultVariants: { direction: "col" },
});

type InputRootProps = React.ComponentProps<"div"> &
  VariantProps<typeof rootStyles> &
  SharedProps;

export const InputRoot = ({
  children,
  direction,
  justify,
  align,
  sharedProps,
}: InputRootProps) => {
  return (
    <InputRootProvider sharedProps={sharedProps}>
      <div className={rootStyles({ direction, justify, align })}>
        {children}
      </div>
    </InputRootProvider>
  );
};
