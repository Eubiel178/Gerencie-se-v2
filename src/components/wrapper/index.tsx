import { VariantProps, tv } from "tailwind-variants";

const wrapperStyles = tv({
  base: " text-blacks",

  variants: {
    flex: {
      flex1: "flex-1",
      flex2: "flex-2",
      flex3: "flex-3",
    },

    display: {
      flex: "flex",
      block: "block",
    },

    direction: {
      row: "flex-row",
      column: "flex-col",
    },

    background: {
      light: "bg-white",
      dark: "bg-gray-500",
      transparent: "bg-transparent",
    },

    gap: {
      xsmall: "gap-1",
      small: "gap-2",
      medium: "gap-3",
      large: "gap-4",
      xlarge: "gap-5",
    },

    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      stretch: "justify-stretch",
    },

    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      between: "items-between",
      stretch: "items-stretch",
    },

    shadow: {
      xsmall: "shadow",
      small: "shadow-sm",
      medium: "shadow-md",
      large: "shadow-lg",
      xlarge: "shadow-xl",
    },

    padding: {
      xsmall: "p-1",
      small: "p-2",
      medium: "p-3",
      large: "p-4",
      xlarge: "p-5",
      xxlarge: "p-6",
    },
  },

  defaultVariants: {
    display: "flex",
  },
});

type WrapperProps = React.ComponentProps<"div"> &
  VariantProps<typeof wrapperStyles>;

export const Wrapper = ({
  children,
  flex,
  display,
  direction,
  background,
  gap,
  justify,
  align,
  shadow,
  padding,
  className,
}: WrapperProps) => {
  return (
    <div
      className={wrapperStyles({
        flex,
        display,
        background,
        gap,
        direction,
        justify,
        align,
        shadow,
        padding,
        className,
      })}
    >
      {children}
    </div>
  );
};
