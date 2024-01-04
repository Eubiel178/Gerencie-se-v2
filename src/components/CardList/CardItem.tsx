import { LiHTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const cardItem = tv({
  base: "h-96 shadow rounded-ee-lg rounded-es-lg",

  variants: {
    display: {
      flex: "flex",
      block: "block",
      hidden: "hidden",
    },

    flexDirection: {
      column: "flex-col",
    },

    minWidth: {
      initial: "min-w-72",
    },

    width: {
      initial: "w-full",
    },

    maxWidth: {
      initial: "max-w-xs",
    },

    colorItem: {
      primary: "bg-white text-gray-950",
    },
  },

  defaultVariants: {
    display: "flex",
    flexDirection: "column",
    minWidth: "initial",
    width: "initial",
    maxWidth: "initial",
    colorItem: "primary",
  },
});

interface CardItemProps
  extends LiHTMLAttributes<HTMLLIElement>,
    VariantProps<typeof cardItem> {}

export const CardItem = ({
  children,
  display,
  flexDirection,
  minWidth,
  width,
  maxWidth,
  colorItem,
  ...rest
}: CardItemProps) => {
  return (
    <li
      className={cardItem({
        display,
        flexDirection,
        minWidth,
        width,
        maxWidth,
        colorItem,
      })}
      {...rest}
    >
      {children}
    </li>
  );
};
