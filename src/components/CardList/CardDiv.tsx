import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const cardDiv = tv({
  base: "flex flex-col",

  variants: {
    flexDirection: {
      row: "flex-row",
    },

    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },

    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },

    height: {
      h32: "h-32",
      full: "h-full",
      flex1: "flex-1",
    },

    padding: {
      md: "p-3.5",
    },
  },
});

interface CardDivProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardDiv> {}

export const CardDiv = ({
  children,
  flexDirection,
  height,
  justify,
  align,
  className,
  padding,
}: CardDivProps) => {
  return (
    <div
      className={cardDiv({
        flexDirection,
        justify,
        align,
        height,
        padding,
        className,
      })}
    >
      {children}
    </div>
  );
};
