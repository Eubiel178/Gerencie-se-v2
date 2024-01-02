import { tv } from "tailwind-variants";
import { TitleProps } from "./type";

const title = tv({
  base: "text-lg font-bold",
});

export const TitleThree = ({ children }: TitleProps) => {
  return <h3 className={title()}>{children}</h3>;
};
