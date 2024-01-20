import { VariantProps, tv } from "tailwind-variants";
import { TitleProps } from "./type";

const titleStyles = tv({
  base: "text-2xl font-black",
});

export const TitleOne = ({
  children,
}: TitleProps & VariantProps<typeof titleStyles>) => {
  return <h1 className={titleStyles()}>{children}</h1>;
};
