import { tv } from "tailwind-variants";
import { TitleProps } from "./type";

const title = tv({
  base: "text-xl font-extrabold",
});

export const TitleTwo = ({ children }: TitleProps) => {
  return <h2 className={title()}>{children}</h2>;
};
