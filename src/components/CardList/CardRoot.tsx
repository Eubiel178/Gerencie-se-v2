import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const cardList = tv({
  base: "flex flex-wrap gap-10",

  variants: {
    flexDirection: {
      column: "flex-col",
    },
  },
});

interface CardRootProps
  extends HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof cardList> {}

export const CardRoot = ({ flexDirection, children }: CardRootProps) => {
  return <ul className={cardList({ flexDirection })}>{children}</ul>;
};
