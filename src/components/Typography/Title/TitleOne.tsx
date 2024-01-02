import { tv } from "tailwind-variants";
import { TitleProps } from "./type";

const title = tv({
  base: "text-2xl font-black",
});

export const TitleOne = ({ children }: TitleProps) => {
  return <h1 className={title()}>{children}</h1>;
};
