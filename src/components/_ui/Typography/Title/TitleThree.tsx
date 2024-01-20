import { VariantProps, tv } from "tailwind-variants";
import { TitleProps } from "./type";

const titleStyles = tv({
  base: "text-lg font-bold",
});

export const TitleThree = ({
  children,
}: TitleProps & VariantProps<typeof titleStyles>) => {
  return <h3 className={titleStyles()}>{children}</h3>;
};
