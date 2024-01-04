import { HTMLAttributes } from "react";
import { VariantProps, tv } from "tailwind-variants";

const cardTitle = tv({
  base: "text-lg font-semibold",
});

interface CardTitleProps
  extends HTMLAttributes<HTMLHeadElement>,
    VariantProps<typeof cardTitle> {
  title: string;
}

export const CardTitle = ({ title }: CardTitleProps) => {
  return <h3 className={cardTitle()}>{title}</h3>;
};
