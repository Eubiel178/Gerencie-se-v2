import { VariantProps, tv } from "tailwind-variants";
import { TitleProps } from "./type";

const titleStyles = tv({
  base: "text-xl font-extrabold",
});

export const TitleTwo = ({
  children,
}: TitleProps & VariantProps<typeof titleStyles>) => {
  return <h2 className={titleStyles()}>{children}</h2>;
};
