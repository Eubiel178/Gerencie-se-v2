import { VariantProps, tv } from "tailwind-variants";
import { TitleProps } from "./type";

const titleStyles = tv({
  base: "text-base font-medium",
});

export const TitleFour = ({
  children,
}: TitleProps & VariantProps<typeof titleStyles>) => {
  return <h4 className={titleStyles()}>{children}</h4>;
};
