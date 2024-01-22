import { VariantProps, tv } from "tailwind-variants";

const listStyles = tv({
  base: "flex gap-6",

  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
    },

    wrap: {
      nowrap: " flex-nowrap",
      wrap: " flex-wrap",
    },
  },

  defaultVariants: {
    wrap: "wrap",
  },
});

type ListProps = React.ComponentProps<"ol"> & VariantProps<typeof listStyles>;

export const List = ({ children, direction, wrap }: ListProps) => {
  return <ul className={listStyles({ direction, wrap })}>{children}</ul>;
};
