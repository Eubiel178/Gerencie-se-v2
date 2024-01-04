import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const cardText = tv({
  base: "text-gray-700 text-sm break-all",

  variants: {
    textColor: {
      primary: "text-gray-700",
      secondary: "text-blue-400",
    },

    margin: {
      mt2: "mt-2",
      mb2: "mb-2",
      mt3: "mt-3",
      mb3: "mb-3",
    },
  },

  defaultVariants: {
    textColor: "primary",
  },
});

interface CardTextProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof cardText> {
  text: string;
}

export const CardText = ({ textColor, margin, text }: CardTextProps) => {
  return <p className={cardText({ textColor, margin })}>{text}</p>;
};
